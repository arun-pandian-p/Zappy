import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate, Enums } from "@/integrations/supabase/types";

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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
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
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders", data.restaurant_id] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders", data.restaurant_id] });
      queryClient.invalidateQueries({ queryKey: ["order", data.id] });
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
        const { error } = await supabase
          .from("orders")
          .update({ status: "preparing" as const, started_preparing_at: new Date().toISOString() })
          .eq("id", orderId);
        if (error) throw error;
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
        const { error } = await supabase
          .from("orders")
          .update({ status: "ready" as const, ready_at: new Date().toISOString() })
          .eq("id", orderId);
        if (error) throw error;
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
        const { error } = await supabase
          .from("orders")
          .update({ status: "served" as const })
          .eq("id", orderId);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["orders"] });
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
