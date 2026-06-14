import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const envLocalConfig = dotenv.parse(fs.readFileSync('.env.local'));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const serviceKey = envLocalConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  console.log("Fetching restaurants...");
  const { data, error } = await supabase.from('restaurants').select('*').limit(10);
  if (error) {
    console.error("Error fetching restaurants:", error);
  } else {
    console.log("Restaurants sample:", JSON.stringify(data, null, 2));
  }
}

run();
