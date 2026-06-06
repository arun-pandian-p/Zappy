import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const envLocalContent = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '';

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`${name}\\s*=\\s*["']?([^"'\r\n]+)["']?`));
  if (match) return match[1];
  const matchLocal = envLocalContent.match(new RegExp(`${name}\\s*=\\s*["']?([^"'\r\n]+)["']?`));
  return matchLocal ? matchLocal[1] : null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Fetching auth users...');
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error fetching users:', authError.message);
  } else {
    console.log('Auth Users:');
    users.forEach(u => console.log(`- Email: ${u.email}, ID: ${u.id}`));
  }

  console.log('\nFetching restaurants...');
  const { data: restaurants, error: restError } = await supabase.from('restaurants').select('*');
  if (restError) {
    console.error('Error fetching restaurants:', restError.message);
  } else {
    console.log('Restaurants:');
    restaurants.forEach(r => console.log(`- Name: ${r.name}, Slug: ${r.slug}, ID: ${r.id}`));
  }

  console.log('\nFetching user roles...');
  const { data: userRoles, error: rolesError } = await supabase.from('user_roles').select('*');
  if (rolesError) {
    console.error('Error fetching user roles:', rolesError.message);
  } else {
    console.log('User Roles:');
    userRoles.forEach(ur => console.log(`- User ID: ${ur.user_id}, Role: ${ur.role}, Restaurant ID: ${ur.restaurant_id}`));
  }
}

check();
