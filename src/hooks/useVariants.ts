import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VariantGroup {
  id: string;
  menu_item_id: string;
  name: string;
  is_required: boolean;
  min_select: number;
  max_select: number;
  display_order: number;
  options?: VariantOption[];
}

export interface VariantOption {
  id: string;
  variant_group_id: string;
  name: string;
  price_modifier: number;
  is_available: boolean;
  display_order: number;
}

export function useVariantGroups(menuItemId?: string) {
  return useQuery({
    queryKey: ["variant_groups", menuItemId],
    queryFn: async () => {
      if (!menuItemId) return [];
      const { data, error } = await supabase
        .from("variant_groups")
        .select("*, variant_options(*)")
        .eq("menu_item_id", menuItemId)
        .order("display_order");
      if (error) throw error;
      return (data || []).map((g: any) => ({
        ...g,
        options: (g.variant_options || []).sort((a: any, b: any) => a.display_order - b.display_order),
      })) as VariantGroup[];
    },
    enabled: !!menuItemId,
  });
}

export function useItemVariantGroups(menuItemIds: string[]) {
  return useQuery({
    queryKey: ["variant_groups_bulk", menuItemIds],
    queryFn: async () => {
      if (!menuItemIds.length) return {};
      const { data, error } = await supabase
        .from("variant_groups")
        .select("*, variant_options(*)")
        .in("menu_item_id", menuItemIds)
        .order("display_order");
      if (error) throw error;
      const map: Record<string, VariantGroup[]> = {};
      (data || []).forEach((g: any) => {
        const group: VariantGroup = {
          ...g,
          options: (g.variant_options || []).sort((a: any, b: any) => a.display_order - b.display_order),
        };
        if (!map[g.menu_item_id]) map[g.menu_item_id] = [];
        map[g.menu_item_id].push(group);
      });
      return map;
    },
    enabled: menuItemIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateVariantGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (group: { menu_item_id: string; name: string; is_required?: boolean; min_select?: number; max_select?: number; display_order?: number }) => {
      const { data, error } = await supabase.from("variant_groups").insert(group).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["variant_groups", d.menu_item_id] }),
  });
}

export function useDeleteVariantGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, menuItemId }: { id: string; menuItemId: string }) => {
      const { error } = await supabase.from("variant_groups").delete().eq("id", id);
      if (error) throw error;
      return { menuItemId };
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["variant_groups", d.menuItemId] }),
  });
}

export function useCreateVariantOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (option: { variant_group_id: string; name: string; price_modifier?: number; display_order?: number }) => {
      const { data, error } = await supabase.from("variant_options").insert(option).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["variant_groups"] }),
  });
}

export function useDeleteVariantOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("variant_options").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["variant_groups"] }),
  });
}
