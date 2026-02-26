import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const email = "zappyscan@gmail.com";
    const password = "zappy1234";

    // Check if user already exists
    const { data: { users } } = await adminClient.auth.admin.listUsers();
    const existing = users?.find((u: any) => u.email === email);

    let userId: string;

    if (existing) {
      userId = existing.id;
      // Update password to ensure it matches
      await adminClient.auth.admin.updateUser(userId, { password });
    } else {
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: "Zappy Admin" },
      });
      if (createError) throw createError;
      userId = newUser.user.id;
    }

    // Check if super_admin role exists
    const { data: existingRole } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!existingRole) {
      const { error: roleError } = await adminClient.from("user_roles").insert({
        user_id: userId,
        role: "super_admin",
      });
      if (roleError) throw roleError;
    }

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
