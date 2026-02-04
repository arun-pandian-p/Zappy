import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type MenuItem = Tables<"menu_items">;
export type Category = Tables<"categories">;
export type MenuItemInsert = TablesInsert<"menu_items">;
export type MenuItemUpdate = TablesUpdate<"menu_items">;

export function useMenuItems(restaurantId?: string) {
  return useQuery({
    queryKey: ["menu_items", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const { data, error } = await supabase
        .from("menu_items")
        .select(`
          *,
          category:categories(id, name, display_order)
        `)
        .eq("restaurant_id", restaurantId)
        .order("display_order");

      if (error) throw error;
      return data as (MenuItem & { category: Pick<Category, "id" | "name" | "display_order"> | null })[];
    },
    enabled: !!restaurantId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCategories(restaurantId?: string) {
  return useQuery({
    queryKey: ["categories", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data as Category[];
    },
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: MenuItemInsert) => {
      const { data, error } = await supabase
        .from("menu_items")
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["menu_items", data.restaurant_id] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: MenuItemUpdate }) => {
      const { data, error } = await supabase
        .from("menu_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["menu_items", data.restaurant_id] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurantId }: { id: string; restaurantId: string }) => {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, restaurantId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["menu_items", data.restaurantId] });
    },
  });
}

export function useToggleMenuItemAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
      const { data, error } = await supabase
        .from("menu_items")
        .update({ is_available: isAvailable })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["menu_items", data.restaurant_id] });
    },
  });
}
