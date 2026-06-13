const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://copkzrwvpqfjpsyyyqdy.supabase.co', 'sb_publishable_2_DJxkLNmzzmvyVXZSbxxg_zSlkOajD');

async function killSession() {
  console.log('Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin123@gmail.com',
    password: 'Admin!123'
  });
  if (authError) {
    console.error('Auth Error:', authError);
    return;
  }
  
  console.log('Logged in successfully. Fetching active table sessions...');
  const { data: sessions, error: sessionError } = await supabase
    .from('table_sessions')
    .select('*')
    .neq('status', 'completed');
  
  if (sessionError) {
    console.error('Session Error:', sessionError);
    return;
  }
  
  console.log(`Found ${sessions.length} active sessions:`, sessions);
  
  for (const session of sessions) {
    console.log(`Killing session ${session.id}...`);
    const { error: updateError } = await supabase
      .from('table_sessions')
      .update({ status: 'completed' })
      .eq('id', session.id);
      
    if (updateError) {
      console.error('Failed to update:', updateError);
    } else {
      console.log(`Successfully completed session ${session.id}`);
    }
  }
  
  console.log('Done!');
}

killSession();
