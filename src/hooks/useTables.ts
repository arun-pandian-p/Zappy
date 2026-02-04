import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Table = Tables<"tables">;
export type TableInsert = TablesInsert<"tables">;
export type TableUpdate = TablesUpdate<"tables">;

// Hook to resolve table number (e.g. "T1") to table UUID
export function useTableByNumber(restaurantId?: string, tableNumber?: string) {
  return useQuery({
    queryKey: ["table-by-number", restaurantId, tableNumber],
    queryFn: async () => {
      if (!restaurantId || !tableNumber) return null;
      
      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("table_number", tableNumber)
        .single();

      if (error) {
        console.error("Error fetching table by number:", error);
        return null;
      }
      return data as Table;
    },
    enabled: !!restaurantId && !!tableNumber,
  });
}

export function useTables(restaurantId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["tables", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("table_number");

      if (error) throw error;
      return data as Table[];
    },
    enabled: !!restaurantId,
    staleTime: 2 * 60 * 1000,
  });

  // Real-time subscription for table updates
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`tables-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tables",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["tables", restaurantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);

  return query;
}

export function useTable(tableId?: string) {
  return useQuery({
    queryKey: ["table", tableId],
    queryFn: async () => {
      if (!tableId) return null;
      
      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .eq("id", tableId)
        .single();

      if (error) throw error;
      return data as Table;
    },
    enabled: !!tableId,
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (table: TableInsert) => {
      const { data, error } = await supabase
        .from("tables")
        .insert(table)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tables", data.restaurant_id] });
    },
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TableUpdate }) => {
      const { data, error } = await supabase
        .from("tables")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tables", data.restaurant_id] });
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurantId }: { id: string; restaurantId: string }) => {
      const { error } = await supabase
        .from("tables")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, restaurantId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tables", data.restaurantId] });
    },
  });
}

export function useUpdateTableStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("tables")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tables", data.restaurant_id] });
    },
  });
}
