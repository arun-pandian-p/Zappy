import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { OrderWithItems } from "@/hooks/useOrders";

/**
 * Customer-specific orders hook:
 * - Filters by table_id at query level (efficient)
 * - Short polling (5s) as fallback
 * - Realtime subscription for instant updates
 */
export function useCustomerOrders(restaurantId?: string, tableId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["customer-orders", restaurantId, tableId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!restaurantId || !tableId) return [];

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items(*),
          table:tables(id, table_number)
        `)
        .eq("restaurant_id", restaurantId)
        .eq("table_id", tableId)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as OrderWithItems[];
    },
    enabled: !!restaurantId && !!tableId,
    staleTime: 3_000,
    refetchInterval: 5_000, // Poll every 5s as fallback
  });

  // Realtime subscription for instant order status updates
  useEffect(() => {
    if (!restaurantId || !tableId) return;

    const channel = supabase
      .channel(`customer-orders-${tableId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `table_id=eq.${tableId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
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
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, tableId, queryClient]);

  return query;
}
