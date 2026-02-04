import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Restaurant = Tables<"restaurants">;

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
