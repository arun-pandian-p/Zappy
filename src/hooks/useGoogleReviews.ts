import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GoogleReview {
  author_name: string;
  author_url: string;
  language: string;
  profile_photo_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export interface GooglePlaceDetails {
  rating: number;
  user_ratings_total: number;
  reviews: GoogleReview[];
  url?: string;
}

export const useGoogleReviews = (placeId?: string | null) => {
  return useQuery({
    queryKey: ['google-reviews', placeId],
    queryFn: async (): Promise<GooglePlaceDetails> => {
      if (!placeId) throw new Error("No Place ID provided");

      const { data, error } = await supabase.functions.invoke('google-places', {
        body: { placeId }
      });

      if (error) {
        console.error("Supabase edge function error:", error);
        throw error;
      }
      if (data.error) {
        throw new Error(data.error);
      }

      return data as GooglePlaceDetails;
    },
    enabled: !!placeId,
    staleTime: 1000 * 60 * 60 * 24, // 24h cache
    retry: 2,
  });
};
