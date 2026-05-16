/**
 * 🖼️ Seed Menu Item Images via Unsplash
 * Fetches and assigns food images from Unsplash to all menu items.
 * 
 * Usage: node scripts/seed/seed_images.cjs
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://syvoshzxoedamaijongb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5dm9zaHp4b2VkYW1haWpvbmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzc5MTksImV4cCI6MjA4NTc1MzkxOX0.lYRP1SQ18C5vng9xdEmTtyqFaba62uOu5ETKlAs3Xy0";
const UNSPLASH_ACCESS_KEY = "yj0MFfgE-D__T4jgS5zA3KXWs8zh8vf9P7nbyMM4cNI";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function searchUnsplash(query) {
  try {
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&client_id=${UNSPLASH_ACCESS_KEY}`);
    const data = await response.json();
    return data.results?.[0]?.urls?.regular || null;
  } catch (error) {
    console.error(`Unsplash search failed for ${query}:`, error);
    return null;
  }
}

async function seedImages() {
  try {
    const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
      email: "admin123@gmail.com",
      password: "admin123"
    });

    if (authError) {
      console.error("Login failed:", authError.message);
      return;
    }
    console.log("Logged in as admin.");

    const userId = auth.user.id;
    const { data: roles } = await supabase.from('user_roles').select('restaurant_id').eq('user_id', userId).single();
    if (!roles) {
      console.error("No restaurant role found for this user.");
      return;
    }
    const restaurantId = roles.restaurant_id;
    console.log(`Target Restaurant ID: ${restaurantId}`);

    const { data: items, error: fetchError } = await supabase
      .from('menu_items')
      .select('id, name')
      .eq('restaurant_id', restaurantId);
    
    if (fetchError) throw fetchError;
    console.log(`Found ${items.length} items to check.`);

    for (const item of items) {
      console.log(`Searching for ${item.name}...`);
      const imageUrl = await searchUnsplash(item.name);
      if (imageUrl) {
        const { error: updateError } = await supabase
          .from('menu_items')
          .update({ image_url: imageUrl })
          .eq('id', item.id);
        
        if (updateError) {
          console.error(`Failed to update ${item.name}:`, updateError.message);
        } else {
          console.log(`Updated ${item.name} with image.`);
        }
      } else {
        console.log(`No image found for ${item.name}`);
      }
      await new Promise(r => setTimeout(r, 500));
    }

    console.log("Image seeding completed!");
  } catch (e) {
    console.error("Fatal error:", e);
  }
}

seedImages();
