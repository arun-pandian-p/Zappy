import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('image_library')
    .select('*, image_usage(count)')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', JSON.stringify(data, null, 2));
  }
}

test();
