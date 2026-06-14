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
    const { placeId } = await req.json()
    if (!placeId) {
      throw new Error("Place ID is required")
    }

    const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error("GOOGLE_PLACES_API_KEY is not configured")
    }

    // Use Google Places API (New) or Details API
    // https://maps.googleapis.com/maps/api/place/details/json?place_id=X&fields=rating,user_ratings_total,reviews&key=Y
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,reviews,url&key=${GOOGLE_PLACES_API_KEY}`
    )
    
    const data = await response.json()
    
    if (data.status !== 'OK') {
      console.error("Google API Error:", data)
      throw new Error(data.error_message || "Failed to fetch from Google Places API")
    }

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
