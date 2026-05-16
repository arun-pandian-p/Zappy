/**
 * 🌱 Seed South Indian Menu Items (TypeScript Version)
 * Usage: npx tsx scripts/seed/seed_south_indian.ts
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://syvoshzxoedamaijongb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5dm9zaHp4b2VkYW1haWpvbmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzc5MTksImV4cCI6MjA4NTc1MzkxOX0.lYRP1SQ18C5vng9xdEmTtyqFaba62uOu5ETKlAs3Xy0";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SOUTH_INDIAN_ITEMS = [
  { name: "Idli (2 pcs)", price: 40, category: "Breakfast", description: "Soft steamed rice cakes served with sambar and chutneys", is_vegetarian: true },
  { name: "Medu Vada (2 pcs)", price: 55, category: "Breakfast", description: "Crispy fried lentil donuts with a soft center", is_vegetarian: true },
  { name: "Masala Dosa", price: 90, category: "Breakfast", description: "Crispy crepe stuffed with spiced potato mash", is_vegetarian: true },
  { name: "Plain Dosa", price: 70, category: "Breakfast", description: "Traditional thin and crispy rice crepe", is_vegetarian: true },
  { name: "Onion Uthappam", price: 100, category: "Breakfast", description: "Thick savory pancake topped with chopped onions", is_vegetarian: true },
  { name: "Ghee Roast Dosa", price: 110, category: "Breakfast", description: "Thin and extra crispy crepe roasted with clarified butter", is_vegetarian: true },
  { name: "Ven Pongal", price: 80, category: "Breakfast", description: "Savory rice and lentil porridge seasoned with black pepper and cumin", is_vegetarian: true },
  { name: "Poori Masala", price: 85, category: "Breakfast", description: "Fluffy deep-fried wheat bread served with potato bhaji", is_vegetarian: true },
  { name: "Mini Tiffin", price: 130, category: "Breakfast", description: "Mini Idli, Vada, Sweet, Small Dosa and Pongal combo", is_vegetarian: true },
  { name: "Filter Coffee", price: 30, category: "Drinks", description: "Authentic South Indian decoction coffee with milk", is_vegetarian: true },
  { name: "Masala Tea", price: 25, category: "Drinks", description: "Strong tea brewed with aromatic spices", is_vegetarian: true },
  { name: "Sambar Rice", price: 90, category: "Main Course", description: "Rice mixed with aromatic lentil sambar and veggies", is_vegetarian: true },
  { name: "Curd Rice", price: 75, category: "Main Course", description: "Refreshing yogurt rice tempered with mustard and ginger", is_vegetarian: true },
  { name: "South Indian Meals", price: 160, category: "Main Course", description: "Full thali with Rice, Sambar, Rasam, Poriyal, Appalam and Curd", is_vegetarian: true },
  { name: "Kesari", price: 50, category: "Desserts", description: "Sweet semolina pudding flavored with saffron and cardamom", is_vegetarian: true },
  { name: "Gulab Jamun (2 pcs)", price: 60, category: "Desserts", description: "Milk-based dumplings soaked in sugar syrup", is_vegetarian: true },
  { name: "Lemon Rice", price: 85, category: "Main Course", description: "Tangy rice flavored with lemon juice and peanuts", is_vegetarian: true },
  { name: "Pesarattu", price: 105, category: "Breakfast", description: "Green gram crepe topped with ginger and onions", is_vegetarian: true },
  { name: "Set Dosa", price: 85, category: "Breakfast", description: "Spongy and soft dosas served in a set of three", is_vegetarian: true },
  { name: "Ginger Tea", price: 30, category: "Drinks", description: "Refreshing tea with a strong kick of fresh ginger", is_vegetarian: true }
];

async function seed() {
  try {
    const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
      email: "admin123@gmail.com",
      password: "admin123"
    });

    if (authError) {
      console.error("Login failed:", authError.message);
      return;
    }

    const { data: restaurants } = await supabase.from('restaurants_public').select('id').limit(1);
    if (!restaurants || restaurants.length === 0) {
      console.error("No restaurant found");
      return;
    }
    const restaurantId = restaurants[0].id;

    const categories = ["Breakfast", "Main Course", "Drinks", "Desserts"];
    const categoryMap: Record<string, string> = {};

    for (const catName of categories) {
      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('name', catName)
        .limit(1);
      
      if (catData && catData.length > 0) {
        categoryMap[catName] = catData[0].id;
      } else {
        const { data: newCat } = await supabase
          .from('categories')
          .insert({ restaurant_id: restaurantId, name: catName, is_active: true })
          .select()
          .single();
        if (newCat) categoryMap[catName] = (newCat as any).id;
      }
    }

    const itemsToInsert = SOUTH_INDIAN_ITEMS.map(item => ({
      restaurant_id: restaurantId,
      category_id: categoryMap[item.category],
      name: item.name,
      price: item.price,
      description: item.description,
      is_vegetarian: item.is_vegetarian,
      is_available: true
    }));

    const { error } = await supabase.from('menu_items').insert(itemsToInsert);
    if (error) {
      console.error("Error seeding items:", error);
    } else {
      console.log("Successfully seeded 20 South Indian items!");
    }
  } catch (e) {
    console.error("Fatal error:", e);
  }
}

seed();
