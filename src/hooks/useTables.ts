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
        .ilike("table_number", tableNumber)
        .eq("is_active", true)
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
        .eq("is_active", true)
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
        .upsert(
          {
            ...table,
            is_active: true,
            deleted_at: null,
          },
          { onConflict: "restaurant_id,table_number" }
        )
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
        .update({ is_active: false, deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw new Error(error.message || JSON.stringify(error));
      return { id, restaurantId };
    },
    onMutate: async ({ id, restaurantId }) => {
      await queryClient.cancelQueries({ queryKey: ["tables", restaurantId] });
      const previous = queryClient.getQueryData<any[]>(["tables", restaurantId]);
      queryClient.setQueryData(["tables", restaurantId], (old: any[] | undefined) => (old || []).filter(t => t.id !== id));
      return { previous };
    },
    onError: (err, vars, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(["tables", vars.restaurantId], context.previous);
      }
    },
    onSettled: (_, __, vars) => {
      queryClient.invalidateQueries({ queryKey: ["tables", vars.restaurantId] });
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

export function useSeatOccupancy(restaurantId?: string, tableSessionId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["seat-occupancy", restaurantId, tableSessionId],
    queryFn: async () => {
      if (!restaurantId || !tableSessionId) return [];
      
      const { data, error } = await supabase
        .from("seat_occupancy")
        .select("*, table_sessions!inner(status)")
        .eq("restaurant_id", restaurantId)
        .eq("table_session_id", tableSessionId)
        .eq("status", "occupied")
        .neq("table_sessions.status", "completed");

      if (error) {
        console.error("Error fetching seat occupancy:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!restaurantId && !!tableSessionId,
    staleTime: 5000,
  });

  // Real-time subscription for seat occupancy
  useEffect(() => {
    if (!restaurantId || !tableSessionId) return;

    const channel = supabase
      .channel(`seat-occupancy-${tableSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "seat_occupancy",
          filter: `table_session_id=eq.${tableSessionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["seat-occupancy", restaurantId, tableSessionId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, tableSessionId, queryClient]);

  return query;
}

export function useAllSeatOccupancy(restaurantId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["seat-occupancy-all", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const { data, error } = await supabase
        .from("seat_occupancy")
        .select("*, table_sessions!inner(status)")
        .eq("restaurant_id", restaurantId)
        .eq("status", "occupied")
        .neq("table_sessions.status", "completed");

      if (error) {
        console.error("Error fetching all seat occupancy:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!restaurantId,
    staleTime: 5000,
  });

  // Real-time subscription for all seat occupancy
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`seat-occupancy-all-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "seat_occupancy",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["seat-occupancy-all", restaurantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);

  return query;
}

export function useOccupySeats() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { 
      restaurantId: string; 
      tableId: string; 
      tableSessionId: string; 
      seatNumbers: number[] 
    }) => {
      const inserts = params.seatNumbers.map(seat => ({
        restaurant_id: params.restaurantId,
        table_id: params.tableId,
        table_session_id: params.tableSessionId,
        seat_number: seat,
        status: 'occupied'
      }));

      const { data, error } = await supabase
        .from("seat_occupancy")
        .insert(inserts)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["seat-occupancy", variables.restaurantId, variables.tableSessionId] });
    }
  });
}
