// Simple DB audit: counts and sample rows for key tables
// Usage: SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/db_audit.js

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  console.error('Set SUPABASE_URL env var');
  process.exit(1);
}

if (!SUPABASE_ANON_KEY) {
  console.warn('No SUPABASE_ANON_KEY provided. Trying unauthenticated reads. Some tables may be RLS-protected.');
}

const fetch = require('node-fetch');

async function queryTable(table, sampleLimit = 3) {
  try {
    const countRes = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`, {
      method: 'HEAD',
      headers: {
        apikey: SUPABASE_ANON_KEY || '',
        Authorization: SUPABASE_ANON_KEY ? `Bearer ${SUPABASE_ANON_KEY}` : '',
      },
    });

    const total = countRes.headers.get('content-range') || 'unknown';

    const sampleRes = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=${sampleLimit}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY || '',
        Authorization: SUPABASE_ANON_KEY ? `Bearer ${SUPABASE_ANON_KEY}` : '',
      },
    });

    const sampleJson = await sampleRes.json();

    return { table, total, sample: sampleJson };
  } catch (err) {
    return { table, error: String(err) };
  }
}

async function main() {
  const tables = [
    'campaign_events',
    'promotions_analytics',
    'ads',
    'tables',
    'qr_codes',
    'customer_events',
  ];

  for (const t of tables) {
    const res = await queryTable(t);
    console.log('---', t, '---');
    if (res.error) {
      console.log('Error:', res.error);
    } else {
      console.log('Count (content-range):', res.total);
      console.log('Sample rows:', JSON.stringify(res.sample, null, 2));
    }
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
