import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generatePassword(length = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "").replace(/^-+|-+$/g, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization")!;

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

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify super_admin
    const { data: callerRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (!callerRole || callerRole.role !== "super_admin") {
      return new Response(JSON.stringify({ error: "Forbidden: Super Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      name, slug, email, phone, address, cuisine_type, branch_count,
      admin_email, logo_url, theme_color, subscription_tier,
    } = body;

    if (!name || !admin_email) {
      return new Response(JSON.stringify({ error: "Hotel name and admin email are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const restaurantSlug = slug || slugify(name);
    const generatedPassword = generatePassword(12);
    const generatedUsername = `${restaurantSlug}_admin`;

    // 1. Create restaurant
    const { data: restaurant, error: restaurantError } = await adminClient
      .from("restaurants")
      .insert({
        name,
        slug: restaurantSlug,
        email: email || admin_email,
        phone: phone || null,
        address: address || null,
        logo_url: logo_url || null,
        primary_color: theme_color || "#3B82F6",
        subscription_tier: subscription_tier || "free",
        is_active: true,
        settings: { cuisine_type: cuisine_type || null, branch_count: branch_count || "1" },
      })
      .select()
      .single();

    if (restaurantError) {
      return new Response(JSON.stringify({ error: restaurantError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Fetch default tax settings and apply
    const { data: taxDefaults } = await adminClient
      .from("default_tax_settings")
      .select("*")
      .limit(1)
      .single();

    if (taxDefaults) {
      await adminClient
        .from("restaurants")
        .update({
          tax_rate: taxDefaults.gst_percent,
          service_charge_rate: taxDefaults.service_charge_percent,
          currency: taxDefaults.currency,
        })
        .eq("id", restaurant.id);
    }

    // 3. Create auth user
    const { data: newUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email: admin_email,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: { name: generatedUsername },
    });

    if (createUserError) {
      // Rollback restaurant
      await adminClient.from("restaurants").delete().eq("id", restaurant.id);
      return new Response(JSON.stringify({ error: createUserError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Assign role
    await adminClient.from("user_roles").insert({
      user_id: newUser.user.id,
      role: "restaurant_admin",
      restaurant_id: restaurant.id,
    });

    // 5. Create staff profile
    await adminClient.from("staff_profiles").insert({
      user_id: newUser.user.id,
      email: admin_email,
      name: generatedUsername,
      restaurant_id: restaurant.id,
      is_active: true,
    });

    // 6. Log action
    await adminClient.from("system_logs").insert({
      actor_id: caller.id,
      actor_email: caller.email,
      action: "create_tenant",
      entity_type: "restaurant",
      entity_id: restaurant.id,
      details: {
        restaurant_name: name,
        admin_email,
        username: generatedUsername,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      restaurant_id: restaurant.id,
      credentials: {
        email: admin_email,
        username: generatedUsername,
        password: generatedPassword,
        login_url: "/admin/login",
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
