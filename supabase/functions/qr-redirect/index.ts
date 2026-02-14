import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Published app base URL for resolving relative target_urls
const APP_BASE_URL = "https://qr-restaurant.lovable.app";

// Simple in-memory rate limiter
const scanCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = scanCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    scanCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

function detectDevice(ua: string): string {
  if (/mobile|android|iphone|ipod/i.test(ua)) return "Mobile";
  if (/tablet|ipad/i.test(ua)) return "Tablet";
  return "Desktop";
}

function resolveTargetUrl(targetUrl: string): string {
  // If already absolute, return as-is
  if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
    return targetUrl;
  }
  // Resolve relative URL against the published app base
  return `${APP_BASE_URL}${targetUrl.startsWith("/") ? "" : "/"}${targetUrl}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // Extract QR ID: prioritize query param over path segment
    const queryId = url.searchParams.get("id");
    const pathParts = url.pathname.split("/");
    const pathId = pathParts[pathParts.length - 1];
    const qrId = queryId || (pathId && pathId !== "qr-redirect" ? pathId : null);

    if (!qrId) {
      return new Response(
        "<html><body><h1>Invalid QR Code</h1><p>This QR code link is invalid.</p></body></html>",
        { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    // Rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(clientIp)) {
      return new Response(
        "<html><body><h1>Too Many Requests</h1><p>Please try again later.</p></body></html>",
        { status: 429, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up QR code
    const { data: qr, error } = await supabase
      .from("qr_codes")
      .select("id, target_url, is_active, expires_at, tenant_id, qr_type")
      .eq("id", qrId)
      .single();

    if (error || !qr) {
      return new Response(
        "<html><body><h1>QR Code Not Found</h1><p>This QR code does not exist.</p></body></html>",
        { status: 404, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    if (!qr.is_active) {
      return new Response(
        "<html><body><h1>QR Code Inactive</h1><p>This QR code has been deactivated.</p></body></html>",
        { status: 410, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    if (qr.expires_at && new Date(qr.expires_at) < new Date()) {
      return new Response(
        "<html><body><h1>QR Code Expired</h1><p>This QR code has expired.</p></body></html>",
        { status: 410, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    // Log scan analytics (fire and forget)
    const userAgent = req.headers.get("user-agent") || "";
    const referrer = req.headers.get("referer") || "";
    const device = detectDevice(userAgent);

    supabase.from("scan_analytics").insert({
      qr_id: qr.id,
      tenant_id: qr.tenant_id,
      device,
      user_agent: userAgent,
      referrer,
    }).then(() => {});

    // Increment scan count atomically via RPC
    supabase.rpc("increment_scan_count" as any, { qr_code_id: qrId }).then(() => {});

    // Resolve target URL to absolute and redirect
    const absoluteUrl = resolveTargetUrl(qr.target_url);

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: absoluteUrl,
      },
    });
  } catch (err) {
    console.error("QR redirect error:", err);
    return new Response(
      "<html><body><h1>Error</h1><p>Something went wrong.</p></body></html>",
      { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );
  }
});
