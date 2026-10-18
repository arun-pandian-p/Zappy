import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// In-memory locks to prevent concurrent duplicate syncs for the same restaurant
const activeSyncLocks = new Map<string, Promise<any>>();
// Rate limit cache: restaurantId -> timestamp of last sync
const lastSyncTimestamps = new Map<string, number>();
const MIN_SYNC_INTERVAL_MS = 30_000; // 30 seconds minimum between syncs

interface GoogleReviewItem {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description?: string;
  text?: string;
  time?: number;
}

/**
 * Fetch with bounded exponential backoff for transient network / quota glitches
 */
async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 2): Promise<Response> {
  let attempt = 0;
  let delay = 500;
  while (true) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status === 404 || res.status === 400 || res.status === 403) {
        return res;
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
    const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY") || Deno.env.get("GOOGLE_MAPS_API_KEY");

    const body = await req.json().catch(() => ({}));
    const action = body.action || "sync";
    const restaurantId = body.restaurantId;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // 1. PUBLIC ACTION: get_public_ratings (No admin auth required, strictly scoped to restaurantId)
    if (action === "get_public_ratings") {
      if (!restaurantId) {
        return new Response(JSON.stringify({ error: "restaurantId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: rest, error } = await adminClient
        .from("restaurants")
        .select("id, name, google_place_id, google_place_name, google_formatted_address, google_rating, google_user_ratings_total, google_maps_url, google_review_url, google_synced_at, google_sync_status, google_reviews_cache, is_active")
        .eq("id", restaurantId)
        .maybeSingle();

      if (error || !rest) {
        return new Response(JSON.stringify({ error: "Restaurant not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if review cache has expired (30-day max Google Places policy)
      let reviews = [];
      const cache = rest.google_reviews_cache as any;
      if (cache && cache.reviews && Array.isArray(cache.reviews)) {
        const expiresAt = cache.expires_at ? new Date(cache.expires_at).getTime() : 0;
        if (Date.now() < expiresAt) {
          reviews = cache.reviews;
        }
      }

      return new Response(
        JSON.stringify({
          restaurantId: rest.id,
          name: rest.name,
          placeId: rest.google_place_id,
          placeName: rest.google_place_name,
          formattedAddress: rest.google_formatted_address,
          rating: rest.google_rating,
          userRatingsTotal: rest.google_user_ratings_total,
          mapsUrl: rest.google_maps_url,
          reviewUrl: rest.google_review_url,
          syncedAt: rest.google_synced_at,
          syncStatus: rest.google_sync_status,
          reviews,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. AUTHORIZATION CHECK for Admin Actions (search, details, sync, disconnect)
    if (!restaurantId) {
      return new Response(JSON.stringify({ error: "restaurantId is required for this action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization header required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized user session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Tenant Isolation Check: verify user is super_admin OR admin for this specific restaurant
    const { data: roleRecord } = await adminClient
      .from("user_roles")
      .select("role, restaurant_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const isSuperAdmin = roleRecord?.role === "super_admin";
    const isTenantAdmin = roleRecord?.restaurant_id === restaurantId;

    if (!isSuperAdmin && !isTenantAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden: You do not have permission to manage this restaurant's location." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. CHECK API KEY AVAILABILITY
    if (!googleApiKey) {
      return new Response(
        JSON.stringify({
          error: "Google Places API key is not configured on the server. Please set GOOGLE_PLACES_API_KEY in your Supabase Edge Function secrets.",
          status: "NOT_CONFIGURED",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. ACTION: DISCONNECT
    if (action === "disconnect") {
      const { error: updateError } = await adminClient
        .from("restaurants")
        .update({
          google_place_id: null,
          google_place_name: null,
          google_formatted_address: null,
          google_rating: null,
          google_user_ratings_total: null,
          google_maps_url: null,
          google_review_url: null,
          google_synced_at: null,
          google_sync_status: "not_connected",
          google_sync_error: null,
          google_reviews_cache: null,
        })
        .eq("id", restaurantId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, message: "Google Places integration disconnected." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. ACTION: SEARCH PLACES (Interactive search candidates with confirmation)
    if (action === "search") {
      const query = (body.query || "").trim();
      if (!query) {
        return new Response(JSON.stringify({ error: "Search query is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${googleApiKey}`;
      const res = await fetchWithRetry(searchUrl);
      const searchData = await res.json();

      if (searchData.status === "ZERO_RESULTS") {
        return new Response(JSON.stringify({ candidates: [], status: "ZERO_RESULTS" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (searchData.status !== "OK") {
        console.error("Google Places Search API Error:", searchData.status, searchData.error_message);
        return new Response(
          JSON.stringify({
            error: searchData.error_message || `Google Places search error: ${searchData.status}`,
            status: searchData.status,
            candidates: [],
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const candidates = (searchData.results || []).slice(0, 5).map((place: any) => ({
        placeId: place.place_id,
        name: place.name,
        formattedAddress: place.formatted_address,
        rating: place.rating || null,
        userRatingsTotal: place.user_ratings_total || 0,
        location: place.geometry?.location || null,
      }));

      return new Response(
        JSON.stringify({ candidates, status: "OK" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. ACTION: DETAILS (Fetch verified details for Place ID)
    if (action === "details") {
      const placeId = body.placeId;
      if (!placeId) {
        return new Response(JSON.stringify({ error: "placeId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,geometry,rating,user_ratings_total,reviews,url&key=${googleApiKey}`;
      const res = await fetchWithRetry(detailsUrl);
      const detailsData = await res.json();

      if (detailsData.status !== "OK") {
        return new Response(
          JSON.stringify({
            error: detailsData.error_message || `Place details error: ${detailsData.status}`,
            status: detailsData.status,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const p = detailsData.result;
      const reviews: GoogleReviewItem[] = (p.reviews || []).map((r: any) => ({
        author_name: r.author_name || "Google Reviewer",
        author_url: r.author_url || undefined,
        profile_photo_url: r.profile_photo_url || undefined,
        rating: Number(r.rating) || 5,
        relative_time_description: r.relative_time_description || "",
        text: r.text || "",
        time: r.time || 0,
      }));

      return new Response(
        JSON.stringify({
          placeId: p.place_id,
          name: p.name,
          formattedAddress: p.formatted_address,
          rating: p.rating || null,
          userRatingsTotal: p.user_ratings_total || 0,
          location: p.geometry?.location || null,
          url: p.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}&query_place_id=${p.place_id}`,
          reviews,
          status: "OK",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. ACTION: SYNC (Connect/Refresh Google Places data for this restaurant)
    if (action === "sync") {
      // Cooldown / Rate Limiting check
      const lastSync = lastSyncTimestamps.get(restaurantId) || 0;
      const timeSinceLastSync = Date.now() - lastSync;
      const isManual = !!body.manual;

      if (!body.placeId && timeSinceLastSync < MIN_SYNC_INTERVAL_MS && !isManual) {
        return new Response(
          JSON.stringify({
            message: "Sync cooldown active. Returning cached data.",
            rateLimited: true,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if a sync is currently in-flight for this restaurant (deduplication)
      if (activeSyncLocks.has(restaurantId)) {
        const existingPromise = activeSyncLocks.get(restaurantId)!;
        const result = await existingPromise;
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create sync task
      const syncTask = (async () => {
        try {
          // Determine Place ID: from request body or database
          let targetPlaceId = body.placeId;
          if (!targetPlaceId) {
            const { data: currentRest } = await adminClient
              .from("restaurants")
              .select("google_place_id")
              .eq("id", restaurantId)
              .single();
            targetPlaceId = currentRest?.google_place_id;
          }

          if (!targetPlaceId) {
            throw new Error("No Google Place ID configured for this restaurant.");
          }

          // Fetch Place Details
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${targetPlaceId}&fields=place_id,name,formatted_address,geometry,rating,user_ratings_total,reviews,url&key=${googleApiKey}`;
          const res = await fetchWithRetry(detailsUrl);
          const data = await res.json();

          if (data.status !== "OK") {
            const errorCategory = data.status || "API_ERROR";
            await adminClient
              .from("restaurants")
              .update({
                google_sync_status: "error",
                google_sync_error: errorCategory,
              })
              .eq("id", restaurantId);

            throw new Error(data.error_message || `Google Places API returned status: ${errorCategory}`);
          }

          const result = data.result;
          const rating = result.rating !== undefined ? Number(result.rating) : null;
          const userRatingsTotal = result.user_ratings_total !== undefined ? Number(result.user_ratings_total) : 0;
          const mapsUrl = result.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.name)}&query_place_id=${targetPlaceId}`;
          const reviewUrl = `https://search.google.com/local/writereview?placeid=${targetPlaceId}`;

          // Obey Google Places Terms: Cache reviews for at most 30 days
          const reviews: GoogleReviewItem[] = (result.reviews || []).slice(0, 5).map((r: any) => ({
            author_name: r.author_name || "Google Reviewer",
            author_url: r.author_url || undefined,
            profile_photo_url: r.profile_photo_url || undefined,
            rating: Number(r.rating) || 5,
            relative_time_description: r.relative_time_description || "",
            text: r.text || "",
            time: r.time || 0,
          }));

          const reviewsCache = {
            cached_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            reviews,
          };

          // Update location coordinates if available and not yet set
          const updates: Record<string, any> = {
            google_place_id: targetPlaceId,
            google_place_name: result.name,
            google_formatted_address: result.formatted_address,
            google_rating: rating,
            google_user_ratings_total: userRatingsTotal,
            google_maps_url: mapsUrl,
            google_review_url: reviewUrl,
            google_synced_at: new Date().toISOString(),
            google_sync_status: "connected",
            google_sync_error: null,
            google_reviews_cache: reviewsCache,
          };

          if (result.geometry?.location?.lat && result.geometry?.location?.lng) {
            updates.latitude = result.geometry.location.lat;
            updates.longitude = result.geometry.location.lng;
          }

          const { error: updateError } = await adminClient
            .from("restaurants")
            .update(updates)
            .eq("id", restaurantId);

          if (updateError) throw updateError;

          lastSyncTimestamps.set(restaurantId, Date.now());

          return {
            success: true,
            placeId: targetPlaceId,
            name: result.name,
            formattedAddress: result.formatted_address,
            rating,
            userRatingsTotal,
            mapsUrl,
            reviewUrl,
            syncedAt: updates.google_synced_at,
            syncStatus: "connected",
            reviews,
          };
        } finally {
          activeSyncLocks.delete(restaurantId);
        }
      })();

      activeSyncLocks.set(restaurantId, syncTask);
      const syncResult = await syncTask;

      return new Response(JSON.stringify(syncResult), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
