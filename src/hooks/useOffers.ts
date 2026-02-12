import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Offer {
  id: string;
  restaurant_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  discount_text: string | null;
  linked_menu_item_id: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useOffers(restaurantId: string) {
  return useQuery({
    queryKey: ["offers", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers" as any)
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Offer[];
    },
    enabled: !!restaurantId,
  });
}

export function useActiveOffers(restaurantId: string) {
  return useQuery({
    queryKey: ["offers", restaurantId, "active"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("offers" as any)
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("is_active", true)
        .lte("start_date", now)
        .gte("end_date", now)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Offer[];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (offer: Omit<Offer, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("offers" as any)
        .insert(offer as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Offer;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["offers", variables.restaurant_id] });
    },
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Offer> }) => {
      const { data, error } = await supabase
        .from("offers" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Offer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, restaurantId }: { id: string; restaurantId: string }) => {
      const { error } = await supabase
        .from("offers" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      return restaurantId;
    },
    onSuccess: (restaurantId) => {
      queryClient.invalidateQueries({ queryKey: ["offers", restaurantId] });
    },
  });
}
