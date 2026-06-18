import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async () => {
  const { data, error } = await supabase.rpc("evict_expired_ai_cache");
  if (error) {
    console.error("Cache eviction failed:", error);
    return new Response(JSON.stringify({ ok: false, error }), { status: 500 });
  }
  console.log(`Evicted ${data} expired cache entries`);
  return new Response(JSON.stringify({ ok: true, evicted: data }), { status: 200 });
});
