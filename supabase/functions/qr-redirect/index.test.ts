import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const BASE_URL = `${SUPABASE_URL}/functions/v1/qr-redirect`;

Deno.test("Missing ID returns 400", async () => {
  const res = await fetch(BASE_URL, {
    headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    redirect: "manual",
  });
  assertEquals(res.status, 400);
  await res.text();
});

Deno.test("Invalid/nonexistent ID returns 404", async () => {
  const res = await fetch(`${BASE_URL}?id=00000000-0000-0000-0000-000000000000`, {
    headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    redirect: "manual",
  });
  assertEquals(res.status, 404);
  await res.text();
});

Deno.test("Valid QR ID via query param returns 302", async () => {
  // First, find an active QR code from the database
  const listRes = await fetch(`${SUPABASE_URL}/rest/v1/qr_codes?is_active=eq.true&limit=1`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  const qrCodes = await listRes.json();

  if (!qrCodes || qrCodes.length === 0) {
    console.log("No active QR codes found, skipping redirect test");
    return;
  }

  const qrId = qrCodes[0].id;
  const res = await fetch(`${BASE_URL}?id=${qrId}`, {
    headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    redirect: "manual",
  });
  assertEquals(res.status, 302);
  const location = res.headers.get("location");
  // Should be an absolute URL
  assertEquals(location?.startsWith("http"), true);
  await res.text();
});
