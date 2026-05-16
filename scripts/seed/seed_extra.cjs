/**
 * 🌱 Seed Extra Menu Items (Chinese, Continental, Desserts, Pizza)
 * Inserts 20 multi-cuisine items with Unsplash images.
 * 
 * Usage: node scripts/seed/seed_extra.cjs
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://syvoshzxoedamaijongb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5dm9zaHp4b2VkYW1haWpvbmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzc5MTksImV4cCI6MjA4NTc1MzkxOX0.lYRP1SQ18C5vng9xdEmTtyqFaba62uOu5ETKlAs3Xy0";
const UNSPLASH_ACCESS_KEY = "yj0MFfgE-D__T4jgS5zA3KXWs8zh8vf9P7nbyMM4cNI";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const extraItems = [
  // Chinese
  { name: "Hakka Noodles", price: 180, category: "Chinese", description: "Wok-tossed noodles with crunchy vegetables.", is_vegetarian: true },
  { name: "Manchurian", price: 160, category: "Chinese", description: "Vegetable balls in spicy soy-ginger sauce.", is_vegetarian: true },
  { name: "Spring Rolls", price: 140, category: "Chinese", description: "Crispy rolls filled with seasoned vegetables.", is_vegetarian: true },
  { name: "Fried Rice", price: 170, category: "Chinese", description: "Classic Chinese fried rice with mixed veggies.", is_vegetarian: true },
  { name: "Chili Chicken", price: 220, category: "Chinese", description: "Spicy and tangy chicken with bell peppers.", is_vegetarian: false },
  // Continental
  { name: "Pasta Alfredo", price: 240, category: "Continental", description: "Creamy white sauce pasta with mushrooms.", is_vegetarian: true },
  { name: "Garlic Bread", price: 120, category: "Continental", description: "Toasted bread with garlic butter and herbs.", is_vegetarian: true },
  { name: "Grilled Sandwich", price: 150, category: "Continental", description: "Toasted sandwich with cheese and veggies.", is_vegetarian: true },
  { name: "French Fries", price: 100, category: "Continental", description: "Golden crispy potato fries.", is_vegetarian: true },
  { name: "Club Sandwich", price: 190, category: "Continental", description: "Triple-decker sandwich with chicken and egg.", is_vegetarian: false },
  // Desserts
  { name: "Gulab Jamun", price: 60, category: "Desserts", description: "Warm milk dumplings in sugar syrup.", is_vegetarian: true },
  { name: "Ice Cream Scoop", price: 80, category: "Desserts", description: "Vanilla or Chocolate scoop.", is_vegetarian: true },
  { name: "Brownie with Ice Cream", price: 150, category: "Desserts", description: "Fudgy brownie with vanilla scoop.", is_vegetarian: true },
  { name: "Chocolate Mousse", price: 130, category: "Desserts", description: "Light and airy chocolate delight.", is_vegetarian: true },
  { name: "Cheesecake", price: 180, category: "Desserts", description: "Classic New York style cheesecake.", is_vegetarian: true },
  // Pizza
  { name: "Margherita Pizza", price: 250, category: "Pizza", description: "Classic cheese and tomato pizza.", is_vegetarian: true },
  { name: "Farmhouse Pizza", price: 320, category: "Pizza", description: "Loaded with fresh farm vegetables.", is_vegetarian: true },
  { name: "Paneer Tikka Pizza", price: 350, category: "Pizza", description: "Spiced paneer and capsicum topping.", is_vegetarian: true },
  { name: "Pepperoni Pizza", price: 420, category: "Pizza", description: "Beef pepperoni with mozzarella.", is_vegetarian: false },
  { name: "BBQ Chicken Pizza", price: 380, category: "Pizza", description: "Smoky BBQ chicken with onions.", is_vegetarian: false }
];

async function searchUnsplash(query) {
  try {
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&client_id=${UNSPLASH_ACCESS_KEY}`);
    const data = await response.json();
    return data.results?.[0]?.urls?.regular || null;
  } catch (error) {
    return null;
  }
}

async function seedExtra() {
  const { data: auth } = await supabase.auth.signInWithPassword({
    email: "admin123@gmail.com",
    password: "admin123"
  });

  const { data: roles } = await supabase.from('user_roles').select('restaurant_id').eq('user_id', auth.user.id).single();
  const restaurantId = roles.restaurant_id;

  const categories = [...new Set(extraItems.map(i => i.category))];
  const categoryMap = {};

  for (const cat of categories) {
    const { data: existing } = await supabase.from('categories').select('id').eq('restaurant_id', restaurantId).eq('name', cat).single();
    if (existing) {
      categoryMap[cat] = existing.id;
    } else {
      const { data: newCat } = await supabase.from('categories').insert({ restaurant_id: restaurantId, name: cat, is_active: true }).select().single();
      categoryMap[cat] = newCat.id;
    }
  }

  for (const item of extraItems) {
    console.log(`Adding ${item.name}...`);
    const imageUrl = await searchUnsplash(item.name);
    
    await supabase.from('menu_items').insert({
      restaurant_id: restaurantId,
      category_id: categoryMap[item.category],
      name: item.name,
      description: item.description,
      price: item.price,
      is_vegetarian: item.is_vegetarian,
      image_url: imageUrl,
      is_available: true
    });
    
    await new Promise(r => setTimeout(r, 500));
  }

  console.log("Seeding complete!");
}

seedExtra();
