/**
 * 📣 Check Active Ads
 * Fetches and displays all platform-wide advertisements.
 * 
 * Usage: node scripts/db/checkAds.js
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjusted path to .env relative to scripts/db/
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key is missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAds() {
  const { data, error } = await supabase.from('ads').select('*');
  if (error) {
    console.error('Error fetching ads:', error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

checkAds();
