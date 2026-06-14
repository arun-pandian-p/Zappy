import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load envs
const envConfig = dotenv.parse(fs.readFileSync('.env'));
const envLocalConfig = dotenv.parse(fs.readFileSync('.env.local'));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const serviceKey = envLocalConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  console.log("Deleting all employees...");
  const { data, error } = await supabase.from('employees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (error) {
    console.error("Error deleting employees:", error);
  } else {
    console.log("Successfully deleted all employees.", data);
  }

  // Also delete test staff profiles and user roles if needed, but let's just clear employees
  const { error: rolesError } = await supabase.from('user_roles').delete().in('role', ['waiter_staff', 'kitchen_staff', 'billing_staff']);
  if (rolesError) {
    console.error("Error deleting roles:", rolesError);
  } else {
    console.log("Successfully deleted non-admin roles.");
  }
}

run();
