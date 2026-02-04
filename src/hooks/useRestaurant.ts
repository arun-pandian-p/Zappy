import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Restaurant = Tables<"restaurants">;
export type RestaurantInsert = TablesInsert<"restaurants">;
export type RestaurantUpdate = TablesUpdate<"restaurants">;

export function useRestaurant(restaurantId?: string) {
  return useQuery({
    queryKey: ["restaurant", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return null;
      
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurantId)
        .single();

      if (error) throw error;
      return data as Restaurant;
    },
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRestaurantBySlug(slug?: string) {
  return useQuery({
    queryKey: ["restaurant", "slug", slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data as Restaurant;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRestaurants() {
  return useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Restaurant[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateRestaurant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RestaurantUpdate }) => {
      const { data: result, error } = await supabase
        .from("restaurants")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["restaurant", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
    },
  });
}

export function useCreateRestaurant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (restaurant: RestaurantInsert) => {
      const { data, error } = await supabase
        .from("restaurants")
        .insert(restaurant)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
    },
  });
}

export function useDeleteRestaurant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("restaurants")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
    },
  });
}
