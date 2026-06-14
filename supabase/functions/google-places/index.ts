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

    if (!placeId && !url) {
      throw new Error("Either Place ID or Google Maps URL is required")
    }

    // Extract Place ID from URL if provided
    if (!placeId && url) {
      if (!url.includes("google.com") && !url.includes("goo.gl")) {
        throw new Error("Invalid Google Maps URL")
      }
      
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
      });
      const text = await res.text();
      const match = text.match(/ChI[a-zA-Z0-9_-]{20,}/);
      
      if (match) {
        placeId = match[0];
      } else {
        throw new Error("Could not extract Place ID from the provided URL. Ensure it is a valid Google Maps link.")
      }
    }

    const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error("GOOGLE_PLACES_API_KEY is not configured")
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews,url&key=${GOOGLE_PLACES_API_KEY}`
    )
    
    const data = await response.json()
    
    if (data.status !== 'OK') {
      console.error("Google API Error:", data)
      throw new Error(data.error_message || "Failed to fetch from Google Places API")
    }

    // Add the extracted placeId to the result so the client can save it
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
