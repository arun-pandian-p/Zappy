import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const envLocalConfig = dotenv.parse(fs.readFileSync('.env.local'));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const serviceKey = envLocalConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  // Find Tamil Nadu tenant
  const { data: restaurants } = await supabase.from('restaurants').select('*');
  const tnTenant = restaurants.find(r => r.name.toLowerCase().includes('tamilnadu') || r.name.toLowerCase().includes('tamil nadu'));
  
  if (!tnTenant) {
    console.log("TOTAL_WAITERS: 0\n\nWAITERS:\nNo waiter records found for Tamil Nadu tenant.");
    return;
  }
  
  const tenantId = tnTenant.id;
  
  // Get employees
  const { data: employees } = await supabase.from('employees').select('*').eq('restaurant_id', tenantId);
  const waiters = employees ? employees.filter(e => e.role === 'WAITER') : [];
  
  // Get staff_profiles
  const { data: staffProfiles } = await supabase.from('staff_profiles').select('*').eq('restaurant_id', tenantId);
  
  // Get auth users
  const { data: authData } = await supabase.auth.admin.listUsers();
  const authUsers = authData?.users || [];
  
  // Get user_roles
  const { data: userRoles } = await supabase.from('user_roles').select('*').eq('restaurant_id', tenantId);

  // Metrics
  let totalWaiters = waiters.length;
  let active = waiters.filter(w => w.status === 'ACTIVE').length;
  let inactive = waiters.filter(w => w.status !== 'ACTIVE').length;
  
  // Duplicates
  let usernames = waiters.map(w => w.username);
  let duplicateCount = usernames.length - new Set(usernames).size;
  
  // Orphan auth records (auth users that have a role or profile for this tenant but no employee record, or vice versa, or just users that don't belong)
  // Let's identify orphans as auth users created for this tenant but missing from employees.
  // Wait, faux emails are created like username@slug.zappy.local
  const tenantSlug = tnTenant.slug;
  const tenantAuthUsers = authUsers.filter(u => u.email && u.email.includes(`@${tenantSlug}.zappy.local`));
  const orphanAuthUsers = tenantAuthUsers.filter(u => !waiters.some(w => w.user_id === u.id));
  
  console.log(`TOTAL_WAITERS: ${totalWaiters}`);
  console.log(`ACTIVE: ${active}`);
  console.log(`INACTIVE: ${inactive}`);
  console.log(`DUPLICATES: ${duplicateCount}`);
  console.log(`ORPHANS: ${orphanAuthUsers.length}`);
  
  console.log(`\nWAITERS:`);
  console.log(`| Name | Email | Phone | Restaurant | Status | Tenant |`);
  if (waiters.length === 0) {
    console.log(`No waiter records found for Tamil Nadu tenant.`);
  } else {
    for (const w of waiters) {
      const authUser = authUsers.find(u => u.id === w.user_id);
      const email = authUser ? authUser.email : 'No Auth';
      console.log(`| ${w.full_name} | ${email} | ${w.phone || '-'} | ${tnTenant.name} | ${w.status} | ${tenantId} |`);
    }
  }
  
  console.log(`\nISSUES:`);
  let issues = [];
  if (duplicateCount > 0) issues.push(`Found ${duplicateCount} duplicate waiter records.`);
  if (orphanAuthUsers.length > 0) issues.push(`Found ${orphanAuthUsers.length} orphaned auth records.`);
  
  const missingRestaurantId = waiters.filter(w => !w.restaurant_id).length;
  if (missingRestaurantId > 0) issues.push(`Found ${missingRestaurantId} waiters missing restaurant_id.`);
  
  if (issues.length === 0) {
    console.log(`- No structural issues found.`);
  } else {
    issues.forEach(i => console.log(`- ${i}`));
  }
  
  console.log(`\nSQL:`);
  console.log(`SELECT * FROM employees WHERE restaurant_id = '${tenantId}' AND role = 'WAITER';`);
}

run();
