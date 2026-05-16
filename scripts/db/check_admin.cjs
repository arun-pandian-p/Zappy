/**
 * 🔍 Check Admin Role
 * Verifies admin login and fetches their role from user_roles table.
 * 
 * Usage: node scripts/db/check_admin.cjs
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://syvoshzxoedamaijongb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5dm9zaHp4b2VkYW1haWpvbmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzc5MTksImV4cCI6MjA4NTc1MzkxOX0.lYRP1SQ18C5vng9xdEmTtyqFaba62uOu5ETKlAs3Xy0";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAdmin() {
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: "admin123@gmail.com",
    password: "admin123"
  });

  if (authError) {
    console.error("Login failed:", authError.message);
    return;
  }

  const userId = auth.user.id;
  const { data: roles } = await supabase.from('user_roles').select('*').eq('user_id', userId).single();
  console.log('Admin Role:', roles);
}

checkAdmin();
