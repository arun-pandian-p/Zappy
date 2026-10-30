import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/services/apiClient";
import type { Tables, TablesInsert, TablesUpdate, Enums } from "@/integrations/supabase/types";
import { analyticsService } from "@/services/analyticsService";
import { SessionLifecycleService } from "@/services/sessionLifecycleService";

export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type OrderStatus = Enums<"order_status">;
export type OrderInsert = TablesInsert<"orders">;
export type OrderItemInsert = TablesInsert<"order_items">;

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
  table?: Pick<Tables<"tables">, "id" | "table_number"> | null;
}

export function useOrders(restaurantId?: string, status?: OrderStatus | OrderStatus[]) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["orders", restaurantId, status],
    queryFn: async () => {
      if (!restaurantId) return [];

      try {
        const data = await apiClient.getOrders(restaurantId, status);
        return data as OrderWithItems[];
      } catch (err) {
        console.warn("Java API getOrders error, falling back to Supabase client:", err);
        let query = supabase
          .from("orders")
          .select(`
            *,
            order_items(*),
            table:tables(id, table_number)
          `)
          .eq("restaurant_id", restaurantId)
          .order("created_at", { ascending: false });

        if (status) {
          if (Array.isArray(status)) {
            query = query.in("status", status);
          } else {
            query = query.eq("status", status);
          }
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as OrderWithItems[];
      }
    },
    enabled: !!restaurantId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Real-time subscription for order updates
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`orders-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["orders", restaurantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);

  return query;
}

export function useOrder(orderId?: string) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;

      try {
        const data = await apiClient.getOrder(orderId);
        return data as OrderWithItems;
      } catch (err) {
        console.warn("Java API getOrder error, falling back to Supabase client:", err);
        const { data, error } = await supabase
          .from("orders")
          .select(`
            *,
            order_items(*),
            table:tables(id, table_number)
          `)
          .eq("id", orderId)
          .single();

        if (error) throw error;
        return data as OrderWithItems;
      }
    },
    enabled: !!orderId,
  });
}

export function useTodayOrders(restaurantId?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return useQuery({
    queryKey: ["orders", "today", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];

      try {
        const data = await apiClient.getTodayOrders(restaurantId);
        return data as OrderWithItems[];
      } catch (err) {
        console.warn("Java API getTodayOrders error, falling back to Supabase client:", err);
        const { data, error } = await supabase
          .from("orders")
          .select(`
            *,
            order_items(*)
          `)
          .eq("restaurant_id", restaurantId)
          .gte("created_at", today.toISOString())
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data as OrderWithItems[];
      }
    },
    enabled: !!restaurantId,
    staleTime: 30 * 1000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      order,
      items,
    }: {
      order: Omit<OrderInsert, "order_number">;
      items: Omit<OrderItemInsert, "order_id">[];
    }) => {
      try {
        const res = await apiClient.createOrder(order.restaurant_id, {
          order,
          items,
        });
        return res;
      } catch (err) {
        console.warn("Java API createOrder error, falling back to Supabase client:", err);
        // Insert order first
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert(order)
          .select()
          .single();

        if (orderError) throw orderError;

        // Insert order items
        const orderItems = items.map((item) => ({
          ...item,
          order_id: orderData.id,
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (itemsError) throw itemsError;

        return orderData;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders", data.restaurant_id] });

      // Track order completed event
      analyticsService.trackEvent({
        campaignId: (data as any).coupon_code || 'organic_order',
        eventType: 'order_completed',
        tenantId: data.restaurant_id,
        metadata: {
          orderId: data.id,
          orderTotal: data.total_amount,
          discountAmount: (data as any).discount_amount || 0
        },
        revenueAmount: Number(data.total_amount) || 0
      });

      // Track coupon redemption if code exists
      if ((data as any).coupon_code) {
        analyticsService.trackCouponRedemption({
          couponCode: (data as any).coupon_code,
          campaignId: null,
          orderId: data.id,
          discountAmount: Number((data as any).discount_amount) || 0,
          orderTotal: Number(data.total_amount) || 0,
          tenantId: data.restaurant_id
        });
      }
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, cancelReason }: { id: string; status: OrderStatus; cancelReason?: string }) => {
      try {
        const res = await apiClient.updateOrderStatus(id, status, cancelReason);
        return res;
      } catch (err) {
        console.warn("Java API updateOrderStatus error, falling back to Supabase client:", err);
        const { data, error } = await supabase
          .from("orders")
          .update({ status })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        // If the order is now served and payment is already paid, close session automatically
        if (status === "served" && data.payment_status === "paid") {
          await supabase
            .from("orders")
            .update({ status: "completed" as const })
            .eq("id", id);

          if (data.restaurant_id) {
            await SessionLifecycleService.closeSessionIfServedAndPaid({
              orderId: data.id,
              tableId: data.table_id,
              tableSessionId: data.table_session_id,
              seatSessionId: data.seat_session_id,
              restaurantId: data.restaurant_id,
              status: "served",
              paymentStatus: "paid",
            });
          }
        }

        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders", data.restaurant_id] });
      queryClient.invalidateQueries({ queryKey: ["order", data.id] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["table_sessions"] });
      queryClient.invalidateQueries({ queryKey: ["seat-occupancy"] });
    },
  });
}

export function useUpdateOrderPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      paymentMethod,
      paymentStatus,
    }: {
      id: string;
      paymentMethod: string;
      paymentStatus: Enums<"payment_status">;
    }) => {
      try {
        const res = await apiClient.updateOrderPayment(id, paymentStatus, paymentMethod);
        return res;
      } catch (err) {
        console.warn("Java API updateOrderPayment error, falling back to Supabase client:", err);
        const { data, error } = await supabase
          .from("orders")
          .update({
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            status: "completed",
          })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders", data.restaurant_id] });
      queryClient.invalidateQueries({ queryKey: ["order", data.id] });
    },
  });
}

// Hook for kitchen-specific order status updates
export function useKitchenOrderActions(restaurantId?: string) {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const startPreparing = useCallback(
    async (orderId: string) => {
      setIsPending(true);
      try {
        try {
          await apiClient.updateOrderStatus(orderId, "preparing");
        } catch {
          const { error } = await supabase
            .from("orders")
            .update({ status: "preparing" as const, started_preparing_at: new Date().toISOString() })
            .eq("id", orderId);
          if (error) throw error;
        }
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      } finally {
        setIsPending(false);
      }
    },
    [queryClient]
  );

  const markReady = useCallback(
    async (orderId: string) => {
      setIsPending(true);
      try {
        try {
          await apiClient.updateOrderStatus(orderId, "ready");
        } catch {
          const { error } = await supabase
            .from("orders")
            .update({ status: "ready" as const, ready_at: new Date().toISOString() })
            .eq("id", orderId);
          if (error) throw error;
        }
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      } finally {
        setIsPending(false);
      }
    },
    [queryClient]
  );

  const markServed = useCallback(
    async (orderId: string) => {
      setIsPending(true);
      try {
        try {
          await apiClient.updateOrderStatus(orderId, "served");
        } catch {
          const { data: updatedOrder, error } = await supabase
            .from("orders")
            .update({ status: "served" as const })
            .eq("id", orderId)
            .select("id, status, payment_status, table_id, table_session_id, seat_session_id, restaurant_id")
            .single();

          if (error) throw error;

          if (updatedOrder && updatedOrder.payment_status === "paid") {
            await supabase
              .from("orders")
              .update({ status: "completed" as const })
              .eq("id", orderId);

            if (updatedOrder.restaurant_id) {
              await SessionLifecycleService.closeSessionIfServedAndPaid({
                orderId: updatedOrder.id,
                tableId: updatedOrder.table_id,
                tableSessionId: updatedOrder.table_session_id,
                seatSessionId: updatedOrder.seat_session_id,
                restaurantId: updatedOrder.restaurant_id,
                status: "served",
                paymentStatus: "paid",
              });
            }
          }
        }

        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["tables"] });
        queryClient.invalidateQueries({ queryKey: ["table_sessions"] });
        queryClient.invalidateQueries({ queryKey: ["seat-occupancy"] });
      } finally {
        setIsPending(false);
      }
    },
    [queryClient]
  );

  return {
    startPreparing,
    markReady,
    markServed,
    isLoading: isPending,
  };
}
