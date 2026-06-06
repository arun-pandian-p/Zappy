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
  console.error('Missing env vars: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Checking database status...');
  
  // Check tables
  const { data: tables, error: tablesError } = await supabase
    .from('audit_logs')
    .select('id')
    .limit(1);
    
  if (tablesError) {
    console.log('audit_logs table does NOT exist or error:', tablesError.message);
  } else {
    console.log('audit_logs table exists!');
  }

  const { data: queue, error: queueError } = await supabase
    .from('notification_queue')
    .select('id')
    .limit(1);
    
  if (queueError) {
    console.log('notification_queue table does NOT exist or error:', queueError.message);
  } else {
    console.log('notification_queue table exists!');
  }

  const { data: aiEnrichments, error: aiEnrichmentsError } = await supabase
    .from('ai_enrichments')
    .select('id')
    .limit(1);
    
  if (aiEnrichmentsError) {
    console.log('ai_enrichments table does NOT exist or error:', aiEnrichmentsError.message);
  } else {
    console.log('ai_enrichments table exists!');
  }

  const { data: imageDiscoveries, error: imageDiscoveriesError } = await supabase
    .from('image_discoveries')
    .select('id')
    .limit(1);
    
  if (imageDiscoveriesError) {
    console.log('image_discoveries table does NOT exist or error:', imageDiscoveriesError.message);
  } else {
    console.log('image_discoveries table exists!');
  }

  // Try calling complete_billing_transaction RPC with dummy args to see if it is defined
  const { data: rpcVal, error: rpcError } = await supabase
    .rpc('complete_billing_transaction', {
      p_order_id: '00000000-0000-0000-0000-000000000000',
      p_payment_method: 'cash',
      p_discount_amount: 0,
      p_total_amount: 0
    });

  if (rpcError) {
    console.log('complete_billing_transaction RPC check status:', rpcError.message);
    if (rpcError.message.includes('does not exist')) {
      console.log('complete_billing_transaction function does NOT exist!');
    } else {
      console.log('complete_billing_transaction function exists (but returned error for dummy args)!');
    }
  } else {
    console.log('complete_billing_transaction function exists and succeeded!');
  }
}

check();
