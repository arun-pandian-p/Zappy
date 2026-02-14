import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      invoice_id,
      restaurant_id,
      table_no,
      customer,
      phone,
      items,
      subtotal,
      tax,
      service_charge,
      discount,
      total,
      payment_method,
    } = body;

    if (!invoice_id || !restaurant_id || !items) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: invoice_id, restaurant_id, items" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = {
      invoice_id,
      table_no,
      customer,
      phone,
      items,
      subtotal,
      tax,
      service_charge,
      discount,
      total,
      payment_method,
    };

    // Log the sync attempt
    const { error: logError } = await supabase.from("invoice_sync_log").insert({
      invoice_id,
      restaurant_id,
      payload,
      status: "pending",
    });

    if (logError) {
      console.error("Failed to log sync attempt:", logError);
    }

    // Try forwarding to ERPNext if URL is configured
    const erpnextUrl = Deno.env.get("ERPNEXT_URL");
    if (erpnextUrl) {
      try {
        const erpResponse = await fetch(`${erpnextUrl}/api/method/erpnext.accounts.doctype.sales_invoice.sales_invoice.make_sales_invoice`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const erpData = await erpResponse.json();

        // Update sync log with response
        await supabase
          .from("invoice_sync_log")
          .update({
            status: erpResponse.ok ? "success" : "failed",
            response: erpData,
            error_message: erpResponse.ok ? null : `HTTP ${erpResponse.status}`,
          })
          .eq("invoice_id", invoice_id)
          .eq("status", "pending");

        return new Response(
          JSON.stringify({
            success: erpResponse.ok,
            synced: true,
            erp_response: erpData,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (fetchErr) {
        // Update sync log with error
        await supabase
          .from("invoice_sync_log")
          .update({
            status: "failed",
            error_message: (fetchErr as Error).message,
          })
          .eq("invoice_id", invoice_id)
          .eq("status", "pending");

        return new Response(
          JSON.stringify({
            success: false,
            synced: false,
            error: "ERPNext unreachable",
            logged: true,
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // No ERPNext URL configured — just log locally
    await supabase
      .from("invoice_sync_log")
      .update({ status: "success", response: { note: "No ERPNEXT_URL configured, logged locally" } })
      .eq("invoice_id", invoice_id)
      .eq("status", "pending");

    return new Response(
      JSON.stringify({ success: true, synced: false, logged: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("push-invoice error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
