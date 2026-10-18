import { supabase } from "@/integrations/supabase/client";

export interface GooglePlaceCandidate {
  placeId: string;
  name: string;
  formattedAddress: string;
  rating: number | null;
  userRatingsTotal: number;
  location?: { lat: number; lng: number } | null;
}

export interface GoogleReviewItem {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description?: string;
  text?: string;
  time?: number;
}

export interface GoogleSyncResult {
  success: boolean;
  placeId?: string;
  name?: string;
  formattedAddress?: string;
  rating?: number | null;
  userRatingsTotal?: number;
  mapsUrl?: string;
  reviewUrl?: string;
  syncedAt?: string;
  syncStatus?: "connected" | "not_connected" | "refresh_required" | "error";
  error?: string;
  reviews?: GoogleReviewItem[];
}

export interface PublicGoogleRatings {
  restaurantId: string;
  name: string;
  placeId: string | null;
  placeName: string | null;
  formattedAddress: string | null;
  rating: number | null;
  userRatingsTotal: number | null;
  mapsUrl: string | null;
  reviewUrl: string | null;
  syncedAt: string | null;
  syncStatus: string | null;
  reviews: GoogleReviewItem[];
}

/**
 * Validates Google Place ID format
 * Standard Google Maps Place IDs are strings starting with "ChIJ" or alphanumeric characters (typically 27-60 chars)
 */
export function validatePlaceId(placeId?: string | null): { valid: boolean; reason?: string } {
  if (!placeId || typeof placeId !== "string") {
    return { valid: false, reason: "Place ID is empty or not provided." };
  }
  const trimmed = placeId.trim();
  if (trimmed.length < 15) {
    return { valid: false, reason: "Place ID is too short (Google Place IDs are typically at least 15 characters)." };
  }
  if (trimmed.length > 255) {
    return { valid: false, reason: "Place ID cannot exceed 255 characters." };
  }
  // Disallow control characters or script injection
  if (!/^[A-Za-z0-9_.-]+$/.test(trimmed)) {
    return { valid: false, reason: "Place ID contains invalid characters. Must contain only valid characters (alphanumeric, dashes, underscores, dots)." };
  }
  return { valid: true };
}

/**
 * Searches Google Places candidates for a restaurant
 * Requires administrator confirmation before connecting
 */
export async function searchGooglePlaces(
  restaurantId: string,
  query: string
): Promise<{ candidates: GooglePlaceCandidate[]; status: string; error?: string }> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return { candidates: [], status: "EMPTY_QUERY" };
  }

  try {
    const { data, error } = await supabase.functions.invoke("google-places", {
      body: {
        action: "search",
        restaurantId,
        query: cleanQuery,
      },
    });

    if (error) {
      console.error("Search Google Places invoke error:", error);
      return { candidates: [], status: "ERROR", error: error.message };
    }

    if (data?.status === "NOT_CONFIGURED") {
      return {
        candidates: [],
        status: "NOT_CONFIGURED",
        error: data.error || "Google Places API key is not configured.",
      };
    }

    if (data?.error && !data.candidates) {
      return { candidates: [], status: data.status || "ERROR", error: data.error };
    }

    return {
      candidates: data?.candidates || [],
      status: data?.status || "OK",
    };
  } catch (err: any) {
    return { candidates: [], status: "NETWORK_ERROR", error: err.message };
  }
}

/**
 * Connects and synchronizes a confirmed Google Place ID to a restaurant
 */
export async function connectAndSyncPlace(
  restaurantId: string,
  placeId: string,
  manual = true
): Promise<GoogleSyncResult> {
  const validation = validatePlaceId(placeId);
  if (!validation.valid) {
    throw new Error(validation.reason || "Invalid Place ID format.");
  }

  const { data, error } = await supabase.functions.invoke("google-places", {
    body: {
      action: "sync",
      restaurantId,
      placeId: placeId.trim(),
      manual,
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to communicate with Google Places service.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as GoogleSyncResult;
}

/**
 * Disconnects Google Places from the restaurant
 */
export async function disconnectGooglePlace(restaurantId: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke("google-places", {
    body: {
      action: "disconnect",
      restaurantId,
    },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return true;
}

/**
 * Manually refreshes Google Places data for an authorized administrator
 */
export async function manualRefreshGooglePlaces(restaurantId: string): Promise<GoogleSyncResult> {
  const { data, error } = await supabase.functions.invoke("google-places", {
    body: {
      action: "sync",
      restaurantId,
      manual: true,
    },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return data as GoogleSyncResult;
}

/**
 * Retrieves public Google rating metadata for customer menus
 * Zero Google API billable cost on page load (reads directly from Supabase with 30-day cached reviews)
 */
export async function getPublicGoogleRatings(restaurantId: string): Promise<PublicGoogleRatings | null> {
  if (!restaurantId) return null;

  try {
    const { data, error } = await supabase.functions.invoke("google-places", {
      body: {
        action: "get_public_ratings",
        restaurantId,
      },
    });

    if (error || !data || data.error) {
      // Fallback: Read directly from Supabase restaurants table if edge function fails
      const { data: restFallback } = await supabase
        .from("restaurants")
        .select("id, name, google_place_id, google_place_name, google_formatted_address, google_rating, google_user_ratings_total, google_maps_url, google_review_url, google_synced_at, google_sync_status, google_reviews_cache")
        .eq("id", restaurantId)
        .maybeSingle();

      if (!restFallback || !restFallback.google_place_id) return null;

      const cache = restFallback.google_reviews_cache as any;
      let reviews = [];
      if (cache && Array.isArray(cache.reviews)) {
        const expiresAt = cache.expires_at ? new Date(cache.expires_at).getTime() : 0;
        if (Date.now() < expiresAt) {
          reviews = cache.reviews;
        }
      }

      return {
        restaurantId: restFallback.id,
        name: restFallback.name,
        placeId: restFallback.google_place_id,
        placeName: restFallback.google_place_name,
        formattedAddress: restFallback.google_formatted_address,
        rating: restFallback.google_rating,
        userRatingsTotal: restFallback.google_user_ratings_total,
        mapsUrl: restFallback.google_maps_url,
        reviewUrl: restFallback.google_review_url,
        syncedAt: restFallback.google_synced_at,
        syncStatus: restFallback.google_sync_status,
        reviews,
      };
    }

    return data as PublicGoogleRatings;
  } catch (err) {
    console.warn("Could not retrieve public Google ratings:", err);
    return null;
  }
}
