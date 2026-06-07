import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";

    // Caller client to validate user's session
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: authError } = await callerClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client with service role to perform the deactivation safely
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller has permission (restaurant_admin or super_admin)
    const { data: callerRole } = await adminClient
      .from("user_roles")
      .select("role, restaurant_id")
      .eq("user_id", caller.id)
      .single();

    if (!callerRole || !["super_admin", "restaurant_admin"].includes(callerRole.role)) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "deactivate") {
      const { id } = body;
      if (!id) {
        return new Response(JSON.stringify({ error: "id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Ensure the QR belongs to caller's restaurant unless super_admin
      const { data: qr } = await adminClient.from("qr_codes").select("id, tenant_id").eq("id", id).single();
      if (!qr) {
        return new Response(JSON.stringify({ error: "QR not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (callerRole.role !== "super_admin" && qr.tenant_id !== callerRole.restaurant_id) {
        return new Response(JSON.stringify({ error: "Forbidden: wrong restaurant context" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await adminClient.from("qr_codes").update({ is_active: false }).eq("id", id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message || error }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Log to system_logs for realtime subscribers (best-effort)
      try {
        await adminClient.from("system_logs").insert({
          actor_id: caller.id,
          actor_email: caller.email,
          action: "deactivate_qr",
          entity_type: "qr_code",
          entity_id: id,
          details: { restaurant_id: qr.tenant_id, by: caller.email },
        });
      } catch (e) {
        console.warn("Failed to insert system log for deactivate_qr", e);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("manage-qr error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
