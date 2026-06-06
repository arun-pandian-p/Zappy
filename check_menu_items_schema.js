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

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('menu_items').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Columns in menu_items:', Object.keys(data[0] || {}));
}

check();
