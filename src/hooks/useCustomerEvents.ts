import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type CustomerEvent = Tables<"customer_events">;
export type CustomerEventInsert = TablesInsert<"customer_events">;

// Event types
export type EventType = 
  | "menu_view"
  | "item_view"
  | "cart_add"
  | "cart_remove"
  | "cart_update"
  | "order_placed"
  | "cart_abandoned"
  | "waiter_called"
  | "search"
  | "category_view";

// Get or create session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem("customer_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("customer_session_id", sessionId);
  }
  return sessionId;
}

export function useTrackEvent() {
  return useMutation({
    mutationFn: async ({
      restaurantId,
      tableId,
      eventType,
      eventData,
    }: {
      restaurantId: string;
      tableId?: string;
      eventType: EventType;
      eventData?: Record<string, unknown>;
    }) => {
      const { error } = await supabase.from("customer_events").insert([{
        restaurant_id: restaurantId,
        table_id: tableId,
        session_id: getSessionId(),
        event_type: eventType,
        event_data: (eventData || {}) as unknown as import("@/integrations/supabase/types").Json,
      }]);

      if (error) throw error;
    },
  });
}

// Convenience hooks for specific events
export function useTrackMenuView(restaurantId: string, tableId?: string) {
  const trackEvent = useTrackEvent();
  
  return () => {
    trackEvent.mutate({
      restaurantId,
      tableId,
      eventType: "menu_view",
    });
  };
}

export function useTrackItemView(restaurantId: string, tableId?: string) {
  const trackEvent = useTrackEvent();
  
  return (itemId: string, itemName: string) => {
    trackEvent.mutate({
      restaurantId,
      tableId,
      eventType: "item_view",
      eventData: { itemId, itemName },
    });
  };
}

export function useTrackCartAdd(restaurantId: string, tableId?: string) {
  const trackEvent = useTrackEvent();
  
  return (itemId: string, itemName: string, quantity: number) => {
    trackEvent.mutate({
      restaurantId,
      tableId,
      eventType: "cart_add",
      eventData: { itemId, itemName, quantity },
    });
  };
}

export function useTrackCartRemove(restaurantId: string, tableId?: string) {
  const trackEvent = useTrackEvent();
  
  return (itemId: string, itemName: string) => {
    trackEvent.mutate({
      restaurantId,
      tableId,
      eventType: "cart_remove",
      eventData: { itemId, itemName },
    });
  };
}

export function useTrackOrderPlaced(restaurantId: string, tableId?: string) {
  const trackEvent = useTrackEvent();
  
  return (orderId: string, total: number, itemCount: number) => {
    trackEvent.mutate({
      restaurantId,
      tableId,
      eventType: "order_placed",
      eventData: { orderId, total, itemCount },
    });
  };
}

// Analytics queries
export function useEventStats(restaurantId?: string, days: number = 7) {
  return useQuery({
    queryKey: ["customer_events", "stats", restaurantId, days],
    queryFn: async () => {
      if (!restaurantId) return null;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("customer_events")
        .select("event_type, created_at")
        .eq("restaurant_id", restaurantId)
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      // Aggregate by event type
      const stats = data.reduce((acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        menuViews: stats["menu_view"] || 0,
        itemViews: stats["item_view"] || 0,
        cartAdds: stats["cart_add"] || 0,
        cartRemoves: stats["cart_remove"] || 0,
        ordersPlaced: stats["order_placed"] || 0,
        cartAbandoned: stats["cart_abandoned"] || 0,
        waiterCalls: stats["waiter_called"] || 0,
        conversionRate: stats["order_placed"] && stats["menu_view"] 
          ? ((stats["order_placed"] / stats["menu_view"]) * 100).toFixed(1) 
          : "0",
      };
    },
    enabled: !!restaurantId,
  });
}

export function useRecentEvents(restaurantId?: string, limit: number = 50) {
  return useQuery({
    queryKey: ["customer_events", "recent", restaurantId, limit],
    queryFn: async () => {
      if (!restaurantId) return [];

      const { data, error } = await supabase
        .from("customer_events")
        .select(`
          *,
          table:tables(table_number)
        `)
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId,
  });
}
