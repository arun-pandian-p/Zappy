import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { OrderWithItems } from "@/hooks/useOrders";

const RECENT_ORDERS_KEY = "zappy_recent_order_ids";

export function getRecentOrderIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentOrderId(orderId: string): void {
  try {
    const ids = getRecentOrderIds();
    if (!ids.includes(orderId)) {
      ids.push(orderId);
      localStorage.setItem(RECENT_ORDERS_KEY, JSON.stringify(ids));
    }
  } catch (err) {
    console.error("Failed to save recent order ID to localStorage:", err);
  }
}

export function useRecentOrders(restaurantId?: string) {
  const queryClient = useQueryClient();
  const [orderIds, setOrderIds] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    setOrderIds(getRecentOrderIds());
  }, []);

  const queryKey = ["recent-orders", restaurantId, orderIds.join(",")];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!restaurantId || orderIds.length === 0) return [];

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items(*),
          table:tables(id, table_number)
        `)
        .eq("restaurant_id", restaurantId)
        .in("id", orderIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as OrderWithItems[];
    },
    enabled: !!restaurantId && orderIds.length > 0,
    staleTime: 5000,
    refetchInterval: 10000, // Poll every 10s as fallback
  });

  // Realtime subscription for updates to any of the tracked orders
  useEffect(() => {
    if (!restaurantId || orderIds.length === 0) return;

    const channel = supabase
      .channel(`recent-orders-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, orderIds, queryClient, queryKey]);

  return {
    ...query,
    orderIds,
    refreshIds: () => setOrderIds(getRecentOrderIds()),
  };
}
