/**
 * 🔒 Check Row Level Security (RLS)
 * Tests anonymous vs authenticated access to Supabase tables.
 * 
 * Usage: node scripts/db/check_rls.cjs
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://syvoshzxoedamaijongb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5dm9zaHp4b2VkYW1haWpvbmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzc5MTksImV4cCI6MjA4NTc1MzkxOX0.lYRP1SQ18C5vng9xdEmTtyqFaba62uOu5ETKlAs3Xy0";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkRLS() {
  // Try anonymous select
  const { data: anonData, error: anonError } = await supabase
    .from('restaurants')
    .select('id, name')
    .limit(1);
  
  console.log("Anonymous select from restaurants:", anonError ? anonError.message : "Success");
  if (anonData) console.log("Data count:", anonData.length);

  // Try select from restaurants_public
  const { data: pubData, error: pubError } = await supabase
    .from('restaurants_public')
    .select('*')
    .limit(1);
  
  console.log("Select from restaurants_public:", pubError ? pubError.message : "Success");
  if (pubData) console.log("Data count:", pubData.length);

  // Try with admin login
  const { data: auth } = await supabase.auth.signInWithPassword({
    email: "admin123@gmail.com",
    password: "admin123"
  });

  const adminClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
  });
  adminClient.auth.setSession(auth.session);

  const { data: adminData, error: adminError } = await adminClient
    .from('restaurants')
    .select('*')
    .eq('id', 'b8b1bc0d-ed79-4ed4-a53c-6acccce6efa9')
    .single();
  
  console.log("Admin select from restaurants:", adminError ? adminError.message : "Success");
  if (adminData) console.log("Restaurant name:", adminData.name);
}

checkRLS();
