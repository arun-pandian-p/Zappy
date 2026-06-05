/**
 * ZAPPY - Fetch all existing IDs from Supabase
 * Run: node scripts/fetch_all_ids.js
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json'
};

async function get(table, select = '*', extra = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}${extra}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = await res.text();
    return { error: err };
  }
  return res.json();
}

async function getAuthUsers() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=200`, { headers });
  const data = await res.json();
  return (data.users || []).map(u => ({ id: u.id, email: u.email, confirmed: !!u.email_confirmed_at }));
}

async function main() {
  console.log('=== FETCHING ALL IDs FROM SUPABASE PROJECT ===\n');
  console.log('Project:', SUPABASE_URL, '\n');

  const [authUsers, restaurants, roles, categories, menuItems, tables, staffProfiles] = await Promise.all([
    getAuthUsers(),
    get('restaurants', 'id,name,slug,email,subscription_tier,is_active'),
    get('user_roles', 'id,user_id,restaurant_id,role'),
    get('categories', 'id,restaurant_id,name,display_order,is_active', '&order=display_order'),
    get('menu_items', 'id,restaurant_id,category_id,name,price,is_available,is_popular', '&order=display_order'),
    get('tables', 'id,restaurant_id,table_number,capacity,status,is_active', '&order=table_number'),
    get('staff_profiles', 'id,restaurant_id,user_id,email,name,is_active'),
  ]);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('AUTH USERS:', authUsers.length);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  authUsers.forEach(u => console.log(`  [${u.confirmed ? '✅' : '❌'}] ${u.email.padEnd(35)} UUID: ${u.id}`));

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('RESTAURANTS:', Array.isArray(restaurants) ? restaurants.length : 0);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (Array.isArray(restaurants)) restaurants.forEach(r => console.log(`  ${r.name.padEnd(30)} tier=${r.subscription_tier.padEnd(12)} id=${r.id}`));

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('USER ROLES:', Array.isArray(roles) ? roles.length : 0);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (Array.isArray(roles)) roles.forEach(r => console.log(`  role=${r.role.padEnd(18)} user_id=${r.user_id}  restaurant_id=${r.restaurant_id}`));

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('CATEGORIES:', Array.isArray(categories) ? categories.length : 0);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (Array.isArray(categories)) categories.forEach(c => console.log(`  [${c.display_order}] ${c.name.padEnd(25)} id=${c.id}`));

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('MENU ITEMS:', Array.isArray(menuItems) ? menuItems.length : 0);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (Array.isArray(menuItems)) menuItems.forEach(m => console.log(`  ₹${String(m.price).padStart(4)} ${m.name.padEnd(35)} id=${m.id}`));

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TABLES:', Array.isArray(tables) ? tables.length : 0);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (Array.isArray(tables)) tables.forEach(t => console.log(`  ${t.table_number.padEnd(8)} cap=${t.capacity}  status=${t.status.padEnd(10)} id=${t.id}`));

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STAFF PROFILES:', Array.isArray(staffProfiles) ? staffProfiles.length : 0);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (Array.isArray(staffProfiles)) staffProfiles.forEach(s => console.log(`  ${s.email.padEnd(35)} name=${s.name}  user_id=${s.user_id}`));

  console.log('\n=== SUMMARY ===');
  console.log(`Auth users: ${authUsers.length}`);
  console.log(`Restaurants: ${Array.isArray(restaurants) ? restaurants.length : 0}`);
  console.log(`User roles: ${Array.isArray(roles) ? roles.length : 0}`);
  console.log(`Categories: ${Array.isArray(categories) ? categories.length : 0}`);
  console.log(`Menu items: ${Array.isArray(menuItems) ? menuItems.length : 0}`);
  console.log(`Tables: ${Array.isArray(tables) ? tables.length : 0}`);
  console.log(`Staff profiles: ${Array.isArray(staffProfiles) ? staffProfiles.length : 0}`);

  // Output structured JSON for use in seeding script
  const state = {
    authUsers,
    restaurants: Array.isArray(restaurants) ? restaurants : [],
    roles: Array.isArray(roles) ? roles : [],
    categories: Array.isArray(categories) ? categories : [],
    menuItems: Array.isArray(menuItems) ? menuItems : [],
    tables: Array.isArray(tables) ? tables : [],
    staffProfiles: Array.isArray(staffProfiles) ? staffProfiles : [],
  };

  const fs = await import('fs');
  fs.writeFileSync('scripts/db_state.json', JSON.stringify(state, null, 2));
  console.log('\n✅ Full state saved to scripts/db_state.json');
}

main().catch(console.error);
