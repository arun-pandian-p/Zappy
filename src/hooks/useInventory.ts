import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InventoryItem {
  id: string;
  restaurant_id: string;
  name: string;
  unit: string;
  current_stock: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface RecipeMapping {
  id: string;
  menu_item_id: string;
  inventory_item_id: string;
  quantity_used: number;
}

export function useInventoryItems(restaurantId?: string) {
  return useQuery({
    queryKey: ["inventory_items", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("name");
      if (error) throw error;
      return data as InventoryItem[];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: { restaurant_id: string; name: string; unit?: string; current_stock?: number; low_stock_threshold?: number }) => {
      const { data, error } = await supabase.from("inventory_items").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["inventory_items", d.restaurant_id] }),
  });
}

export function useUpdateInventoryStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, current_stock, restaurantId }: { id: string; current_stock: number; restaurantId: string }) => {
      const { error } = await supabase.from("inventory_items").update({ current_stock }).eq("id", id);
      if (error) throw error;
      return { restaurantId };
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["inventory_items", d.restaurantId] }),
  });
}

export function useDeleteInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, restaurantId }: { id: string; restaurantId: string }) => {
      const { error } = await supabase.from("inventory_items").delete().eq("id", id);
      if (error) throw error;
      return { restaurantId };
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["inventory_items", d.restaurantId] }),
  });
}

export function useRecipeMappings(menuItemId?: string) {
  return useQuery({
    queryKey: ["recipe_mappings", menuItemId],
    queryFn: async () => {
      if (!menuItemId) return [];
      const { data, error } = await supabase
        .from("recipe_mappings")
        .select("*, inventory_items(name, unit)")
        .eq("menu_item_id", menuItemId);
      if (error) throw error;
      return data as (RecipeMapping & { inventory_items: { name: string; unit: string } })[];
    },
    enabled: !!menuItemId,
  });
}

export function useCreateRecipeMapping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mapping: { menu_item_id: string; inventory_item_id: string; quantity_used: number }) => {
      const { data, error } = await supabase.from("recipe_mappings").insert(mapping).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["recipe_mappings", d.menu_item_id] }),
  });
}

export function useDeleteRecipeMapping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, menuItemId }: { id: string; menuItemId: string }) => {
      const { error } = await supabase.from("recipe_mappings").delete().eq("id", id);
      if (error) throw error;
      return { menuItemId };
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["recipe_mappings", d.menuItemId] }),
  });
}
