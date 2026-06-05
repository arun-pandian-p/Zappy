/**
 * Fix restaurant name for admin123@gmail.com
 * Rename from "zcafe`s" to correct name
 */

const fs = (await import('fs')).default;
const envContent = fs.readFileSync('.env', 'utf8');
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line.includes('='))
    .map(line => {
      const [key, ...rest] = line.split('=');
      return [key.trim(), rest.join('=').replace(/"/g, '').trim()];
    })
);

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const RESTAURANT_ID = '11111111-1111-1111-1111-000000000001';

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

// Update the restaurant name and details
const res = await fetch(
  `${SUPABASE_URL}/rest/v1/restaurants?id=eq.${RESTAURANT_ID}`,
  {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      name: 'Zappy Demo Restaurant',
      slug: 'zappy-demo',
      description: 'A premium QR-based dining experience. Fresh ingredients, bold flavors. Powered by Zappy.',
      address: '123 Food Street, Bengaluru, Karnataka 560001',
      phone: '+91 98765 43210',
      email: 'admin123@gmail.com',
      currency: 'INR',
      tax_rate: 5.00,
      service_charge_rate: 2.00,
      primary_color: '#6366F1',
      secondary_color: '#10B981',
      font_family: 'Inter',
      subscription_tier: 'pro',
      is_active: true,
      ads_enabled: true,
      onboarding_completed: true
    })
  }
);

if (!res.ok) {
  const err = await res.text();
  console.error('❌ Failed to update:', err);
} else {
  const data = await res.json();
  console.log('✅ Restaurant updated successfully!');
  console.log('   New name:', data[0]?.name);
  console.log('   Slug:', data[0]?.slug);
  console.log('   ID:', data[0]?.id);
}

// Also update the QR Dine Pro Demo restaurant name
const res2 = await fetch(
  `${SUPABASE_URL}/rest/v1/restaurants?id=eq.00000000-0000-0000-0000-000000000001`,
  {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      name: 'QR Dine Demo',
      description: 'A modern dining experience with QR-based ordering. Demo restaurant for Zappy platform.',
    })
  }
);
if (res2.ok) {
  console.log('✅ Demo restaurant name also cleaned up');
}
