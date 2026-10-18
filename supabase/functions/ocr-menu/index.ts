import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Client } from "https://esm.sh/@gradio/client@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

// Simple per-tenant sliding window rate limiter (max 30 requests / minute)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;

function checkRateLimit(tenantId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(tenantId) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  validTimestamps.push(now);
  rateLimitMap.set(tenantId, validTimestamps);
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized: Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const requestedRestaurantId = formData.get("restaurant_id") as string | null;
    const task = (formData.get("task") as string) || "Full OCR (Layout & Text)";
    const format = (formData.get("format") as string) || "JSON";

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // File validation: Size limit (max 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: "File exceeds 50MB limit" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // File validation: Format check
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "bmp", "tiff", "pdf"];
    const fileExt = (file.name.split(".").pop() || "").toLowerCase();
    const isAllowedExt = allowedExtensions.includes(fileExt);
    const isAllowedMime =
      file.type.startsWith("image/") || file.type === "application/pdf" || file.type === "";

    if (!isAllowedExt && !isAllowedMime) {
      return new Response(
        JSON.stringify({ error: "Invalid file format. Allowed formats: JPG, PNG, WebP, BMP, PDF" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Tenant Identity Verification: Never trust raw browser restaurant_id blindly
    let effectiveRestaurantId = requestedRestaurantId;

    if (effectiveRestaurantId) {
      // Check if user is owner of the restaurant
      const { data: ownedRestaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("id", effectiveRestaurantId)
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!ownedRestaurant) {
        // Check if user is an authorized staff member
        const { data: staffMember } = await supabase
          .from("restaurant_staff")
          .select("id, role")
          .eq("restaurant_id", effectiveRestaurantId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!staffMember) {
          return new Response(
            JSON.stringify({ error: "Forbidden: You are not authorized for this restaurant" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } else {
      // Derive tenant identity directly from authenticated server-side session
      const { data: defaultRestaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();

      if (defaultRestaurant) {
        effectiveRestaurantId = defaultRestaurant.id;
      } else {
        const { data: staffRestaurant } = await supabase
          .from("restaurant_staff")
          .select("restaurant_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (staffRestaurant) {
          effectiveRestaurantId = staffRestaurant.restaurant_id;
        } else {
          return new Response(
            JSON.stringify({ error: "Forbidden: No restaurant tenant associated with this account" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Apply Rate Limiting per tenant
    if (!checkRateLimit(effectiveRestaurantId!)) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please wait a moment before sending more OCR requests.",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side PaddleOCR space invocation
    const spaceUrl =
      Deno.env.get("HF_PADDLE_OCR_SPACE_URL") || "https://arrown-paddle-ocr-space.hf.space";
    const hfToken = Deno.env.get("HF_TOKEN") || Deno.env.get("HUGGINGFACE_API_TOKEN");

    const clientOptions: any = {};
    if (hfToken) {
      clientOptions.hf_token = hfToken;
    }

    const client = await Client.connect(spaceUrl, clientOptions);

    const predictResult = await client.predict("/predict", {
      image: file,
      task,
      format_choice: format,
    });

    const resultData = predictResult.data as any;
    const extractedText = Array.isArray(resultData) ? resultData[0] : String(resultData);

    // Return structured OCR extraction without persisting menu items
    // (Never persist items until confirmed by the user in the UI)
    return new Response(
      JSON.stringify({
        success: true,
        text: extractedText,
        task,
        format,
        restaurant_id: effectiveRestaurantId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    // Avoid logging sensitive document content or credentials
    console.error("[ocr-menu proxy error]", error?.message || error);
    return new Response(
      JSON.stringify({
        error: error?.message || "Failed to process OCR on backend",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
