import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Ad = Tables<"ads">;
export type AdInsert = TablesInsert<"ads">;
export type AdUpdate = TablesUpdate<"ads">;

export function useAds() {
  return useQuery({
    queryKey: ["ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Ad[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useActiveAds(categories?: string[], locations?: string[]) {
  return useQuery({
    queryKey: ["ads", "active", categories, locations],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      let query = supabase
        .from("ads")
        .select("*")
        .eq("is_active", true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`);

      const { data, error } = await query;

      if (error) throw error;

      // Filter by categories and locations if provided
      let filteredAds = data as Ad[];
      
      if (categories && categories.length > 0) {
        filteredAds = filteredAds.filter(ad => {
          if (!ad.target_categories || ad.target_categories.length === 0) return true;
          return ad.target_categories.some(cat => categories.includes(cat));
        });
      }

      if (locations && locations.length > 0) {
        filteredAds = filteredAds.filter(ad => {
          if (!ad.target_locations || ad.target_locations.length === 0) return true;
          return ad.target_locations.some(loc => locations.includes(loc));
        });
      }

      return filteredAds;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRandomActiveAd(categories?: string[], locations?: string[]) {
  const { data: ads, ...rest } = useActiveAds(categories, locations);

  const randomAd = ads && ads.length > 0 
    ? ads[Math.floor(Math.random() * ads.length)] 
    : null;

  return { data: randomAd, ...rest };
}

export function useCreateAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ad: AdInsert) => {
      const { data, error } = await supabase
        .from("ads")
        .insert(ad)
        .select();

      if (error) throw error;
      return data?.[0] || null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
  });
}

export function useUpdateAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: AdUpdate }) => {
      const { data, error } = await supabase
        .from("ads")
        .update(updates)
        .eq("id", id)
        .select();

      if (error) throw error;
      return data?.[0] || null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
  });
}

export function useDeleteAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ads")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
  });
}

export function useTrackAdImpression() {
  return useMutation({
    mutationFn: async (adId: string) => {
      const { data: ad } = await supabase
        .from("ads")
        .select("impressions")
        .eq("id", adId)
        .single();
      
      await supabase
        .from("ads")
        .update({ impressions: (ad?.impressions || 0) + 1 })
        .eq("id", adId);
    },
  });
}

export function useTrackAdClick() {
  return useMutation({
    mutationFn: async (adId: string) => {
      const { data: ad } = await supabase
        .from("ads")
        .select("clicks")
        .eq("id", adId)
        .single();
      
      await supabase
        .from("ads")
        .update({ clicks: (ad?.clicks || 0) + 1 })
        .eq("id", adId);
    },
  });
}
