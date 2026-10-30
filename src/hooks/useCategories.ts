import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/services/apiClient";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Category = Tables<"categories">;
export type CategoryInsert = TablesInsert<"categories">;
export type CategoryUpdate = TablesUpdate<"categories">;

export function useCategories(restaurantId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`categories-standalone-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "categories",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["categories", restaurantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);

  return useQuery({
    queryKey: ["categories", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];

      try {
        const categories = await apiClient.getCategories(restaurantId);
        return (categories as Category[]).filter(
          (c) => c.name && c.name.trim().toLowerCase() !== "uncategorized"
        );
      } catch (err) {
        console.warn("Java API getCategories error, falling back to Supabase client:", err);
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .eq("is_active", true)
          .order("display_order");

        if (error) throw error;
        return (data as Category[]).filter(
          (c) => c.name && c.name.trim().toLowerCase() !== "uncategorized"
        );
      }
    },
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: CategoryInsert) => {
      try {
        return await apiClient.createCategory(category.restaurant_id, category);
      } catch (err) {
        console.warn("Java API createCategory error, falling back to Supabase client:", err);
        const { data, error } = await supabase
          .from("categories")
          .insert(category)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories", data.restaurant_id] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CategoryUpdate }) => {
      try {
        return await apiClient.updateCategory(id, updates);
      } catch (err) {
        console.warn("Java API updateCategory error, falling back to Supabase client:", err);
        const { data, error } = await supabase
          .from("categories")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories", data.restaurant_id] });
    },
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ restaurantId, categoryIds }: { restaurantId: string; categoryIds: string[] }) => {
      try {
        return await apiClient.reorderCategories(restaurantId, categoryIds);
      } catch (err) {
        console.warn("Java API reorderCategories error, falling back to Supabase batch:", err);
        const updates = categoryIds.map((id, index) =>
          supabase
            .from("categories")
            .update({ display_order: index })
            .eq("id", id)
        );
        await Promise.all(updates);
        return { success: true };
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["categories", variables.restaurantId] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurantId }: { id: string; restaurantId: string }) => {
      try {
        await apiClient.deleteCategory(id);
        return { id, restaurantId };
      } catch (err) {
        console.warn("Java API deleteCategory error, falling back to Supabase client:", err);
        const { error } = await supabase
          .from("categories")
          .delete()
          .eq("id", id);

        if (error) throw error;
        return { id, restaurantId };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories", data.restaurantId] });
    },
  });
}
