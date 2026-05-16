/**
 * 🎨 Fix Menu Images with AI
 * Generates AI-style images for menu items and offers using Pollinations AI.
 * 
 * Usage: node scripts/seed/fix_images.cjs
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://syvoshzxoedamaijongb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5dm9zaHp4b2VkYW1haWpvbmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzc5MTksImV4cCI6MjA4NTc1MzkxOX0.lYRP1SQ18C5vng9xdEmTtyqFaba62uOu5ETKlAs3Xy0";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixImages() {
  const { data: items } = await supabase.from('menu_items').select('id, name');
  
  if (items) {
    console.log(`Fixing ${items.length} items...`);
    for (const item of items) {
      const aiPrompt = encodeURIComponent(`${item.name}, delicious South Indian professional food photography, 4k, restaurant style`);
      const imageUrl = `https://image.pollinations.ai/prompt/${aiPrompt}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
      
      await supabase
        .from('menu_items')
        .update({ image_url: imageUrl })
        .eq('id', item.id);
      
      console.log(`Updated ${item.name}`);
    }
  }

  // Also fix offers
  const { data: offers } = await supabase.from('offers').select('id, title');
  if (offers) {
    for (const offer of offers) {
      const aiPrompt = encodeURIComponent(`${offer.title}, restaurant special offer banner, professional food photography, 4k`);
      const imageUrl = `https://image.pollinations.ai/prompt/${aiPrompt}?width=800&height=400&nologo=true`;
      
      await supabase
        .from('offers')
        .update({ image_url: imageUrl })
        .eq('id', offer.id);
      
      console.log(`Updated offer: ${offer.title}`);
    }
  }

  console.log("All images updated with Pollinations AI URLs!");
}

fixImages();
