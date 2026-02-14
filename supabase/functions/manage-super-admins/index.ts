import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Verify caller is super_admin
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
    const { action } = body;

    // LIST all super admin team members
    if (action === "list") {
      const { data: roles, error: rolesError } = await adminClient
        .from("user_roles")
        .select("user_id, created_at")
        .eq("role", "super_admin");

      if (rolesError) throw rolesError;

      // Get user details for each
      const members = [];
      for (const role of (roles || [])) {
        const { data: { user } } = await adminClient.auth.admin.getUserById(role.user_id);
        if (user) {
          members.push({
            user_id: user.id,
            email: user.email,
            name: user.user_metadata?.name || null,
            created_at: role.created_at,
          });
        }
      }

      return new Response(JSON.stringify({ members }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ADD a new super admin team member
    if (action === "add") {
      const { email, name } = body;
      if (!email) {
        return new Response(JSON.stringify({ error: "Email is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if user already exists
      const { data: { users: existingUsers } } = await adminClient.auth.admin.listUsers();
      const existing = existingUsers?.find((u: any) => u.email === email);

      let userId: string;

      if (existing) {
        // Check if already super_admin
        const { data: existingRole } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", existing.id)
          .eq("role", "super_admin")
          .maybeSingle();

        if (existingRole) {
          return new Response(JSON.stringify({ error: "User is already a Super Admin" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        userId = existing.id;
      } else {
        // Create new user with random password
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
        let password = "";
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        for (let i = 0; i < 16; i++) password += chars[array[i] % chars.length];

        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name: name || email.split("@")[0] },
        });

        if (createError) {
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        userId = newUser.user.id;
      }

      // Assign super_admin role
      await adminClient.from("user_roles").insert({
        user_id: userId,
        role: "super_admin",
      });

      // Log action
      await adminClient.from("system_logs").insert({
        actor_id: caller.id,
        actor_email: caller.email,
        action: "add_super_admin",
        entity_type: "user",
        entity_id: userId,
        details: { email, added_by: caller.email },
      });

      return new Response(JSON.stringify({ success: true, user_id: userId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // REMOVE a super admin team member
    if (action === "remove") {
      const { user_id } = body;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Prevent removing yourself
      if (user_id === caller.id) {
        return new Response(JSON.stringify({ error: "Cannot remove yourself" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await adminClient.from("user_roles").delete().eq("user_id", user_id).eq("role", "super_admin");

      // Log action
      await adminClient.from("system_logs").insert({
        actor_id: caller.id,
        actor_email: caller.email,
        action: "remove_super_admin",
        entity_type: "user",
        entity_id: user_id,
        details: { removed_by: caller.email },
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
