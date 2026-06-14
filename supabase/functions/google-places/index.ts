import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { placeId: providedPlaceId, url } = await req.json()
    let placeId = providedPlaceId;

    const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error("GOOGLE_PLACES_API_KEY is not configured")
    }

    // Step 1: Resolve Place ID from URL using Text Search API
    if (!placeId && url) {
      let name = "";
      let location = "";

      try {
        const parsedUrl = new URL(url);
        const pathParts = parsedUrl.pathname.split('/');
        const placeIndex = pathParts.indexOf('place');
        if (placeIndex !== -1 && pathParts.length > placeIndex + 1) {
          name = decodeURIComponent(pathParts[placeIndex + 1].replace(/\+/g, ' '));
        }
        
        const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (match) {
          location = `${match[1]},${match[2]}`;
        }
      } catch (e) {
        throw new Error("Invalid Google Maps URL format");
      }

      if (!name) {
        throw new Error("Could not extract business name from the Google Maps URL. Please ensure it's a full /maps/place/... URL.");
      }

      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(name)}${location ? `&location=${location}` : ''}&key=${GOOGLE_PLACES_API_KEY}`;
      
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (searchData.status !== 'OK' || !searchData.results || searchData.results.length === 0) {
        throw new Error("Business not found via Google Places API.");
      }

      placeId = searchData.results[0].place_id;
    }

    if (!placeId) {
      throw new Error("Either Place ID or Google Maps URL is required");
    }

    // Step 2: Fetch detailed info using Place ID
    const detailsResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews,url&key=${GOOGLE_PLACES_API_KEY}`
    )
    
    const data = await detailsResponse.json()
    
    if (data.status !== 'OK') {
      console.error("Google API Error:", data)
      throw new Error(data.error_message || "Failed to fetch from Google Places Details API")
    }

    // Include the extracted placeId
    data.result.extracted_place_id = placeId;

    return new Response(
      JSON.stringify(data.result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
