import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"
import webpush from "npm:web-push"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "BF3B3qJqYQ3z4Y4uWw3c1k9m_4Wn4S-6z3mD3J6X-X3Y4z3mD3J6X-X3Y4z3mD3J6X-X3Y4z3mD3J6X";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:support@zappy.ind.in";

if (VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Credentials': 'true',
      }
    });
  }

  try {
    const payload = await req.json();
    const { record, type, table } = payload;

    if (!record || type !== 'INSERT' || table !== 'notification_queue') {
      return new Response(JSON.stringify({ message: "Invalid payload or database event" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Fetch subscriptions based on targeted entity
    let query = supabaseAdmin
      .from('notification_subscriptions')
      .select('*')
      .eq('restaurant_id', record.restaurant_id);

    if (record.target_table_id) {
      // Order status updates: notify customer devices subscribed at this table
      query = query.eq('table_id', record.target_table_id);
    } else if (record.target_user_id) {
      // Direct message to a specific staff/user
      query = query.eq('user_id', record.target_user_id);
    } else {
      // Waiter calls/alerts: notify all logged-in staff of the restaurant (anonymous table_id IS NULL)
      query = query.is('table_id', null).not('user_id', 'is', null);
    }

    const { data: subscriptions, error: subError } = await query;
    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      // Mark as processed with no active subscribers
      await supabaseAdmin
        .from('notification_queue')
        .update({ status: 'sent', error_log: 'No subscribers registered for this target' })
        .eq('id', record.id);

      return new Response(JSON.stringify({ status: "success", message: "No subscribers found" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. Prepare payload
    const pushPayload = JSON.stringify({
      title: record.title,
      message: record.message,
      payload: record.payload || {}
    });

    // 3. Deliver to each subscribed browser
    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: sub.keys
        };

        try {
          if (!VAPID_PRIVATE_KEY) {
            throw new Error("VAPID_PRIVATE_KEY environment variable is missing on Edge Function configuration");
          }

          const response = await webpush.sendNotification(pushSubscription, pushPayload);

          // Log success in logs table
          await supabaseAdmin.from('notification_logs').insert({
            queue_id: record.id,
            subscription_id: sub.id,
            response_status: response.statusCode
          });

          return { subscriptionId: sub.id, status: 'success' };
        } catch (err: any) {
          console.error(`Error sending push notification to sub ${sub.id}:`, err);

          // Delete subscription if expired/unreachable (Gone 410 or NotFound 404)
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabaseAdmin.from('notification_subscriptions').delete().eq('id', sub.id);
          }

          // Log failure status
          await supabaseAdmin.from('notification_logs').insert({
            queue_id: record.id,
            subscription_id: sub.id,
            response_status: err.statusCode || 500
          });

          return { subscriptionId: sub.id, status: 'failed', error: err.message };
        }
      })
    );

    const failures = results.filter(r => r.status === 'failed');

    // 4. Update queue row status
    await supabaseAdmin
      .from('notification_queue')
      .update({
        status: failures.length === results.length ? 'failed' : 'sent',
        error_log: failures.length > 0 ? JSON.stringify(failures) : null
      })
      .eq('id', record.id);

    return new Response(JSON.stringify({ status: "processed", count: results.length }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("Internal processing error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
