import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { analyticsService } from "@/services/analyticsService";

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

/** Fetch active ads filtered by placement type and optionally by target restaurant */
export function useAdsByPlacement(placementType: string, restaurantId?: string) {
  return useQuery({
    queryKey: ["ads", "placement", placementType, restaurantId],
    queryFn: async () => {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("is_active", true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order("priority", { ascending: false });

      if (error) throw error;

      // Filter by placement_type and target_restaurants client-side
      // (since these are new columns not yet in generated types)
      let filtered = (data as any[]).filter(ad => (ad.placement_type || 'popup_offer') === placementType);

      if (restaurantId) {
        filtered = filtered.filter(ad => {
          const targets = ad.target_restaurants as string[] | null;
          if (!targets || targets.length === 0) return true; // null = all restaurants
          return targets.includes(restaurantId);
        });
      }

      return filtered as Ad[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!placementType,
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

      if (error) throw new Error(error.message || JSON.stringify(error));
      return id;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["ads"] });
      const previous = queryClient.getQueryData<Ad[]>(["ads"]);
      queryClient.setQueryData(["ads"], (old) => (old || []).filter(a => a.id !== id));
      return { previous };
    },
    onError: (err, id, context: any) => {
      if (context?.previous) queryClient.setQueryData(["ads"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
  });
}

export function useTrackAdImpression() {
  return useMutation({
    mutationFn: async (adId: string) => {
      const isUuid = (val: any) => typeof val === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89ABab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(val);
      if (!isUuid(adId)) throw new Error('Invalid ad id');

      const { data: ad, error: adError } = await supabase
        .from("ads")
        .select("restaurant_id")
        .eq("id", adId)
        .single();
      if (adError) throw adError;

      // Save to promotions_analytics
      const sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('zappy_analytics_session') || 'unknown' : 'server';
      try {
        await supabase
          .from("promotions_analytics" as any)
          .insert({
            restaurant_id: ad?.restaurant_id || null,
            promotion_id: isUuid(adId) ? adId : null,
            event_type: 'impression',
            session_id: sessionId
          });
      } catch (paErr) {
        console.warn('Failed to insert promotions_analytics:', paErr);
      }

      // Async database event recording via analyticsService
      await analyticsService.trackEvent({
        campaignId: isUuid(adId) ? adId : undefined,
        eventType: 'impression',
        tenantId: ad?.restaurant_id
      });
    },
  });
}

export function useTrackAdClick() {
  return useMutation({
    mutationFn: async (adId: string) => {
      const isUuid = (val: any) => typeof val === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89ABab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(val);
      if (!isUuid(adId)) throw new Error('Invalid ad id');

      const { data: ad, error: adError } = await supabase
        .from("ads")
        .select("restaurant_id")
        .eq("id", adId)
        .single();
      if (adError) throw adError;

      // Save to promotions_analytics
      const sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('zappy_analytics_session') || 'unknown' : 'server';
      try {
        await supabase
          .from("promotions_analytics" as any)
          .insert({
            restaurant_id: ad?.restaurant_id || null,
            promotion_id: isUuid(adId) ? adId : null,
            event_type: 'click',
            session_id: sessionId
          });
      } catch (paErr) {
        console.warn('Failed to insert promotions_analytics:', paErr);
      }

      // Async database event recording via analyticsService
      await analyticsService.trackEvent({
        campaignId: isUuid(adId) ? adId : undefined,
        eventType: 'click',
        tenantId: ad?.restaurant_id
      });
    },
  });
}
