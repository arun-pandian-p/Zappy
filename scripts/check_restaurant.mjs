/**
 * Fetch and update restaurant data for admin123@gmail.com
 */

// Load env from .env file manually
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

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json'
};

// 1. Fetch all restaurants
const res = await fetch(`${SUPABASE_URL}/rest/v1/restaurants?select=id,name,slug,email,is_active`, { headers });
const restaurants = await res.json();

console.log('\n=== RESTAURANTS IN NEW PROJECT ===');
restaurants.forEach(r => {
  console.log(`  name="${r.name}"  slug="${r.slug}"  email="${r.email}"  id=${r.id}`);
});

// 2. Fetch all user_roles joined
const rolesRes = await fetch(`${SUPABASE_URL}/rest/v1/user_roles?select=*`, { headers });
const roles = await rolesRes.json();
console.log('\n=== USER ROLES ===');
roles.forEach(r => console.log(`  role=${r.role}  user=${r.user_id}  restaurant=${r.restaurant_id}`));

// 3. Fetch auth users
const usersRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { headers });
const usersData = await usersRes.json();
console.log('\n=== AUTH USERS ===');
(usersData.users || []).forEach(u => console.log(`  ${u.email}  id=${u.id}`));
