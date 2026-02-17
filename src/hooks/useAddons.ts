import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AddonGroup {
  id: string;
  restaurant_id: string;
  name: string;
  min_select: number;
  max_select: number;
  display_order: number;
  options?: AddonOption[];
}

export interface AddonOption {
  id: string;
  addon_group_id: string;
  name: string;
  price: number;
  is_available: boolean;
  display_order: number;
}

export function useAddonGroups(restaurantId?: string) {
  return useQuery({
    queryKey: ["addon_groups", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("addon_groups")
        .select("*, addon_options(*)")
        .eq("restaurant_id", restaurantId)
        .order("display_order");
      if (error) throw error;
      return (data || []).map((g: any) => ({
        ...g,
        options: (g.addon_options || []).sort((a: any, b: any) => a.display_order - b.display_order),
      })) as AddonGroup[];
    },
    enabled: !!restaurantId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateAddonGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (group: { restaurant_id: string; name: string; min_select?: number; max_select?: number }) => {
      const { data, error } = await supabase.from("addon_groups").insert(group).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["addon_groups", d.restaurant_id] }),
  });
}

export function useDeleteAddonGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, restaurantId }: { id: string; restaurantId: string }) => {
      const { error } = await supabase.from("addon_groups").delete().eq("id", id);
      if (error) throw error;
      return { restaurantId };
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["addon_groups", d.restaurantId] }),
  });
}

export function useCreateAddonOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (option: { addon_group_id: string; name: string; price?: number; display_order?: number }) => {
      const { data, error } = await supabase.from("addon_options").insert(option).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addon_groups"] }),
  });
}

export function useDeleteAddonOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addon_options").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addon_groups"] }),
  });
}
