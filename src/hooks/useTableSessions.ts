import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type TableSession = Tables<"table_sessions">;
export type TableSessionInsert = TablesInsert<"table_sessions">;
export type TableSessionUpdate = TablesUpdate<"table_sessions">;

export interface TableSessionWithTable extends TableSession {
  table?: {
    table_number: string;
    capacity: number | null;
  } | null;
}

export function useTableSessions(restaurantId?: string) {
  return useQuery({
    queryKey: ["table_sessions", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const { data, error } = await supabase
        .from("table_sessions")
        .select(`
          *,
          table:tables(table_number, capacity)
        `)
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TableSessionWithTable[];
    },
    enabled: !!restaurantId,
  });
}

export function useActiveTableSessions(restaurantId?: string) {
  return useQuery({
    queryKey: ["table_sessions", "active", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const { data, error } = await supabase
        .from("table_sessions")
        .select(`
          *,
          table:tables(table_number, capacity)
        `)
        .eq("restaurant_id", restaurantId)
        .neq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TableSessionWithTable[];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateTableSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: TableSessionInsert) => {
      const { data, error } = await supabase
        .from("table_sessions")
        .insert({
          ...session,
          seated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["table_sessions", variables.restaurant_id] });
    },
  });
}

export function useUpdateTableSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TableSessionUpdate }) => {
      const { data, error } = await supabase
        .from("table_sessions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table_sessions"] });
    },
  });
}

// Calculate time durations
export function calculateSessionTimers(session: TableSession) {
  const now = new Date();
  
  const getMinutes = (start: string | null, end: string | null) => {
    if (!start) return null;
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : now;
    return Math.floor((endDate.getTime() - startDate.getTime()) / 60000);
  };

  return {
    waitTime: getMinutes(session.seated_at, session.order_placed_at),
    prepTime: getMinutes(session.order_placed_at, session.food_ready_at),
    serviceTime: getMinutes(session.food_ready_at, session.served_at),
    billingTime: getMinutes(session.served_at, session.billing_at),
    totalTime: getMinutes(session.seated_at, session.completed_at),
  };
}

export function formatTimer(minutes: number | null) {
  if (minutes === null) return "--:--";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}
