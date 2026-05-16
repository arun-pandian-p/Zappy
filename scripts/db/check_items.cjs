/**
 * 🔍 Check Menu Items
 * Logs the count and sample of menu items for the admin's restaurant.
 * 
 * Usage: node scripts/db/check_items.cjs
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://syvoshzxoedamaijongb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5dm9zaHp4b2VkYW1haWpvbmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzc5MTksImV4cCI6MjA4NTc1MzkxOX0.lYRP1SQ18C5vng9xdEmTtyqFaba62uOu5ETKlAs3Xy0";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkItems() {
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: "admin123@gmail.com",
    password: "admin123"
  });

  if (authError) {
    console.error("Login failed:", authError.message);
    return;
  }

  const { data: roles } = await supabase.from('user_roles').select('restaurant_id').eq('user_id', auth.user.id).single();
  const restaurantId = roles.restaurant_id;

  const { count, error } = await supabase
    .from('menu_items')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId);
  
  console.log(`Restaurant ${restaurantId} has ${count} items.`);

  const { data: items } = await supabase
    .from('menu_items')
    .select('name, image_url')
    .eq('restaurant_id', restaurantId)
    .limit(10);
  
  console.log("Sample items:", items);
}

checkItems();
