/**
 * 🗄️ Test Supabase Connection
 * Simple fetch to verify anonymous access to the restaurants table.
 * 
 * Usage: node scripts/db/test_supabase.js
 */
async function testSupabase() {
  const url = 'https://syvoshzxoedamaijongb.supabase.co/rest/v1/restaurants?select=*';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IlpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5dm9zaHp4b2VkYW1haWpvbmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzc5MTksImV4cCI6MjA4NTc1MzkxOX0.lYRP1SQ18C5vng9xdEmTtyqFaba62uOu5ETKlAs3Xy0';
  
  try {
    const response = await fetch(url, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    const data = await response.json();
    console.log('Data:', data);
  } catch (error) {
    console.error('Fetch failed:', error);
  }
}

testSupabase();
