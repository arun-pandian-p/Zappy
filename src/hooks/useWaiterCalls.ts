import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type WaiterCall = Tables<"waiter_calls">;
export type WaiterCallInsert = TablesInsert<"waiter_calls">;

export interface WaiterCallWithTable extends WaiterCall {
  table?: Pick<Tables<"tables">, "id" | "table_number"> | null;
}

export function useWaiterCalls(restaurantId?: string, status?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["waiter_calls", restaurantId, status],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      let query = supabase
        .from("waiter_calls")
        .select(`
          *,
          table:tables(id, table_number)
        `)
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as WaiterCallWithTable[];
    },
    enabled: !!restaurantId,
    staleTime: 30 * 1000,
  });

  // Real-time subscription for waiter calls
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`waiter-calls-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waiter_calls",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["waiter_calls", restaurantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);

  return query;
}

export function usePendingWaiterCalls(restaurantId?: string) {
  return useWaiterCalls(restaurantId, "pending");
}

export function useCreateWaiterCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (call: WaiterCallInsert) => {
      const { data, error } = await supabase
        .from("waiter_calls")
        .insert(call)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["waiter_calls", data.restaurant_id] });
    },
  });
}

export function useAcknowledgeWaiterCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { data, error } = await supabase
        .from("waiter_calls")
        .update({
          status: "acknowledged",
          responded_by: userId,
          responded_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["waiter_calls", data.restaurant_id] });
    },
  });
}

export function useResolveWaiterCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data, error } = await supabase
        .from("waiter_calls")
        .update({
          status: "resolved",
          responded_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["waiter_calls", data.restaurant_id] });
    },
  });
}
