import { createClient } from '@supabase/supabase-js';

(async () => {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    process.exit(2);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false }
  });

  try {
    const id = 'efd69b90-c9f4-497d-bacc-28504b610b6d';
    const { data, error } = await supabase
      .from('qr_codes')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Update error:', error);
      process.exit(1);
    }
    console.log('Update success:', data);
  } catch (e) {
    console.error('Exception:', e);
  }
})();
