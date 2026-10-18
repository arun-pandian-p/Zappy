import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GoogleReview {
  author_name: string;
  author_url?: string;
  language?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description?: string;
  text?: string;
  time?: number;
}

export interface GooglePlaceDetails {
  rating: number | null;
  user_ratings_total: number;
  reviews: GoogleReview[];
  url?: string;
  place_id?: string;
  name?: string;
  formatted_address?: string;
}

export const useGoogleReviews = (placeId?: string | null, restaurantId?: string | null) => {
  return useQuery({
    queryKey: ['google-reviews', placeId, restaurantId],
    queryFn: async (): Promise<GooglePlaceDetails> => {
      if (!placeId && !restaurantId) throw new Error("Place ID or Restaurant ID is required");

      const body: Record<string, any> = { action: "details" };
      if (placeId) body.placeId = placeId;
      if (restaurantId) body.restaurantId = restaurantId;

      const { data, error } = await supabase.functions.invoke('google-places', {
        body
      });

      if (error) {
        console.warn("Google Places fetch error, checking local fallback:", error.message);
        // Fallback to restaurants table cache if available
        if (restaurantId) {
          const { data: rest } = await supabase
            .from('restaurants')
            .select('google_rating, google_user_ratings_total, google_maps_url, google_reviews_cache')
            .eq('id', restaurantId)
            .maybeSingle();

          if (rest) {
            const cache = rest.google_reviews_cache as any;
            return {
              rating: rest.google_rating,
              user_ratings_total: rest.google_user_ratings_total || 0,
              reviews: cache?.reviews || [],
              url: rest.google_maps_url || undefined,
            };
          }
        }
        throw error;
      }

      if (data?.error && !data.rating) {
        throw new Error(data.error);
      }

      return {
        rating: data.rating,
        user_ratings_total: data.userRatingsTotal || data.user_ratings_total || 0,
        reviews: data.reviews || [],
        url: data.url || data.mapsUrl,
        place_id: data.placeId || placeId,
        name: data.name,
        formatted_address: data.formattedAddress,
      };
    },
    enabled: !!(placeId || restaurantId),
    staleTime: 1000 * 60 * 60 * 24, // 24h cache
    retry: 1,
  });
};
