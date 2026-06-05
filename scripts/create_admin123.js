/**
 * ZAPPY - Create Auth User + Seed Database for admin123@gmail.com
 * 
 * This script:
 * 1. Creates the auth user admin123@gmail.com in Supabase Auth
 * 2. Confirms the email automatically
 * 3. Runs the seed SQL to assign restaurant_admin role + all data
 * 
 * Usage: node scripts/create_admin123.js
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_EMAIL = 'admin123@gmail.com';
const ADMIN_PASSWORD = 'admin123';

async function createUser() {
  console.log(`\n📧 Creating auth user: ${ADMIN_EMAIL}`);
  
  // Use Admin API to create user (bypasses email confirmation)
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,  // Auto-confirm email
      user_metadata: {
        name: 'Admin User',
        role: 'restaurant_admin'
      }
    })
  });

  const data = await res.json();
  
  if (!res.ok) {
    if (data.msg && data.msg.includes('already been registered')) {
      console.log(`⚠️  User already exists. Fetching existing user...`);
      return await getExistingUser();
    }
    throw new Error(`Failed to create user: ${JSON.stringify(data)}`);
  }

  console.log(`✅ User created! UUID: ${data.id}`);
  return data.id;
}

async function getExistingUser() {
  // List users and find by email
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1000`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    }
  });
  
  const data = await res.json();
  const users = data.users || [];
  const user = users.find(u => u.email === ADMIN_EMAIL);
  
  if (!user) throw new Error('Could not find existing user');
  
  console.log(`✅ Found existing user UUID: ${user.id}`);
  return user.id;
}

async function seedDatabase(userId) {
  console.log(`\n🌱 Seeding database for user ${userId}...`);
  
  const RESTAURANT_ID = '11111111-1111-1111-1111-000000000001';
  const CAT_STARTERS  = '11111111-2222-0000-0001-000000000001';
  const CAT_BURGERS   = '11111111-2222-0000-0001-000000000002';
  const CAT_PIZZA     = '11111111-2222-0000-0001-000000000003';
  const CAT_MAIN      = '11111111-2222-0000-0001-000000000004';
  const CAT_BIRYANI   = '11111111-2222-0000-0001-000000000005';
  const CAT_SIDES     = '11111111-2222-0000-0001-000000000006';
  const CAT_DESSERTS  = '11111111-2222-0000-0001-000000000007';
  const CAT_DRINKS    = '11111111-2222-0000-0001-000000000008';
  const CAT_MOCKTAILS = '11111111-2222-0000-0001-000000000009';

  // Execute SQL via RPC
  const sql = `
    -- Restaurant
    INSERT INTO public.restaurants (
      id, name, slug, description, address, phone, email,
      currency, tax_rate, service_charge_rate,
      primary_color, secondary_color, font_family,
      subscription_tier, is_active, ads_enabled, onboarding_completed
    ) VALUES (
      '${RESTAURANT_ID}',
      'Admin123 Restaurant',
      'admin123-restaurant',
      'A premium dining experience with QR-based ordering. Fresh ingredients, bold flavors.',
      '123 Food Street, Bengaluru, Karnataka 560001',
      '+91 98765 43210',
      '${ADMIN_EMAIL}',
      'INR', 5.00, 2.00,
      '#6366F1', '#10B981', 'Inter',
      'pro', true, true, true
    ) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, is_active = true;

    -- Role
    INSERT INTO public.user_roles (user_id, restaurant_id, role)
    VALUES ('${userId}', '${RESTAURANT_ID}', 'restaurant_admin')
    ON CONFLICT (user_id, restaurant_id, role) DO NOTHING;

    -- Staff Profile
    INSERT INTO public.staff_profiles (restaurant_id, user_id, email, name, is_active)
    VALUES ('${RESTAURANT_ID}', '${userId}', '${ADMIN_EMAIL}', 'Admin Manager', true)
    ON CONFLICT (user_id) DO UPDATE SET name = 'Admin Manager', is_active = true;

    -- Categories
    INSERT INTO public.categories (id, restaurant_id, name, display_order, is_active) VALUES
      ('${CAT_STARTERS}',  '${RESTAURANT_ID}', 'Starters & Snacks', 1, true),
      ('${CAT_BURGERS}',   '${RESTAURANT_ID}', 'Burgers',            2, true),
      ('${CAT_PIZZA}',     '${RESTAURANT_ID}', 'Pizza',              3, true),
      ('${CAT_MAIN}',      '${RESTAURANT_ID}', 'Main Course',        4, true),
      ('${CAT_BIRYANI}',   '${RESTAURANT_ID}', 'Biryani & Rice',     5, true),
      ('${CAT_SIDES}',     '${RESTAURANT_ID}', 'Sides & Extras',     6, true),
      ('${CAT_DESSERTS}',  '${RESTAURANT_ID}', 'Desserts',           7, true),
      ('${CAT_DRINKS}',    '${RESTAURANT_ID}', 'Hot & Cold Drinks',  8, true),
      ('${CAT_MOCKTAILS}', '${RESTAURANT_ID}', 'Mocktails',          9, true)
    ON CONFLICT (name, restaurant_id) DO NOTHING;

    -- Tables
    INSERT INTO public.tables (id, restaurant_id, table_number, capacity, status, is_active) VALUES
      ('11111111-4444-0000-0001-000000000001', '${RESTAURANT_ID}', 'T01', 2, 'available', true),
      ('11111111-4444-0000-0001-000000000002', '${RESTAURANT_ID}', 'T02', 2, 'available', true),
      ('11111111-4444-0000-0001-000000000003', '${RESTAURANT_ID}', 'T03', 4, 'available', true),
      ('11111111-4444-0000-0001-000000000004', '${RESTAURANT_ID}', 'T04', 4, 'available', true),
      ('11111111-4444-0000-0001-000000000005', '${RESTAURANT_ID}', 'T05', 4, 'available', true),
      ('11111111-4444-0000-0001-000000000006', '${RESTAURANT_ID}', 'T06', 6, 'available', true),
      ('11111111-4444-0000-0001-000000000007', '${RESTAURANT_ID}', 'T07', 6, 'available', true),
      ('11111111-4444-0000-0001-000000000008', '${RESTAURANT_ID}', 'T08', 8, 'available', true),
      ('11111111-4444-0000-0001-000000000009', '${RESTAURANT_ID}', 'T09', 8, 'available', true),
      ('11111111-4444-0000-0001-000000000010', '${RESTAURANT_ID}', 'T10', 10, 'available', true)
    ON CONFLICT (restaurant_id, table_number) DO NOTHING;

    SELECT 'Done' as result;
  `;

  // Execute via REST API (using rpc or direct query)  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ sql })
  });

  if (!res.ok) {
    const text = await res.text();
    console.log('⚠️  RPC exec not available, please run the SQL file manually');
    return false;
  }

  console.log('✅ Database seeded!');
  return true;
}

async function insertMenuItems(userId) {
  console.log('\n🍽️  Inserting menu items via REST API...');
  
  const RESTAURANT_ID = '11111111-1111-1111-1111-000000000001';
  const CAT_STARTERS  = '11111111-2222-0000-0001-000000000001';
  const CAT_BURGERS   = '11111111-2222-0000-0001-000000000002';
  const CAT_PIZZA     = '11111111-2222-0000-0001-000000000003';
  const CAT_MAIN      = '11111111-2222-0000-0001-000000000004';
  const CAT_BIRYANI   = '11111111-2222-0000-0001-000000000005';
  const CAT_SIDES     = '11111111-2222-0000-0001-000000000006';
  const CAT_DESSERTS  = '11111111-2222-0000-0001-000000000007';
  const CAT_DRINKS    = '11111111-2222-0000-0001-000000000008';
  const CAT_MOCKTAILS = '11111111-2222-0000-0001-000000000009';

  const menuItems = [
    // Starters
    { id: '11111111-3333-0001-0001-000000000001', restaurant_id: RESTAURANT_ID, category_id: CAT_STARTERS, name: 'Crispy Spring Rolls', description: 'Golden fried vegetable spring rolls served with sweet chili sauce', price: 149, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400', is_vegetarian: true, is_available: true, is_popular: true, prep_time_minutes: 10, display_order: 1 },
    { id: '11111111-3333-0001-0001-000000000002', restaurant_id: RESTAURANT_ID, category_id: CAT_STARTERS, name: 'Paneer Tikka', description: 'Marinated cottage cheese cubes grilled in tandoor', price: 249, image_url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400', is_vegetarian: true, is_available: true, is_popular: true, prep_time_minutes: 20, display_order: 2 },
    { id: '11111111-3333-0001-0001-000000000003', restaurant_id: RESTAURANT_ID, category_id: CAT_STARTERS, name: 'Chicken Wings BBQ', description: 'Crispy chicken wings tossed in smoky BBQ sauce', price: 299, image_url: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400', is_vegetarian: false, is_available: true, is_popular: true, prep_time_minutes: 18, display_order: 3 },
    { id: '11111111-3333-0001-0001-000000000004', restaurant_id: RESTAURANT_ID, category_id: CAT_STARTERS, name: 'Loaded Nachos', description: 'Tortilla chips with cheese sauce, jalapeños, salsa, and sour cream', price: 199, image_url: 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400', is_vegetarian: true, is_available: true, is_popular: false, prep_time_minutes: 10, display_order: 4 },
    // Burgers
    { id: '11111111-3333-0002-0001-000000000001', restaurant_id: RESTAURANT_ID, category_id: CAT_BURGERS, name: 'Classic Veg Burger', description: 'Crispy veggie patty, fresh lettuce, tomato, onion, and our secret sauce', price: 179, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', is_vegetarian: true, is_available: true, is_popular: false, prep_time_minutes: 12, display_order: 1 },
    { id: '11111111-3333-0002-0001-000000000002', restaurant_id: RESTAURANT_ID, category_id: CAT_BURGERS, name: 'Zappy Chicken Burger', description: 'Juicy grilled chicken patty with cheese, jalapeños and sriracha mayo', price: 249, image_url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400', is_vegetarian: false, is_available: true, is_popular: true, prep_time_minutes: 15, display_order: 2 },
    { id: '11111111-3333-0002-0001-000000000003', restaurant_id: RESTAURANT_ID, category_id: CAT_BURGERS, name: 'BBQ Bacon Smash Burger', description: 'Double smash patty with crispy bacon, cheddar, pickles, and BBQ sauce', price: 349, image_url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400', is_vegetarian: false, is_available: true, is_popular: true, prep_time_minutes: 18, display_order: 3 },
    // Pizza
    { id: '11111111-3333-0003-0001-000000000001', restaurant_id: RESTAURANT_ID, category_id: CAT_PIZZA, name: 'Margherita Pizza', description: 'Classic San Marzano tomato sauce, fresh mozzarella, and basil', price: 299, image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', is_vegetarian: true, is_available: true, is_popular: true, prep_time_minutes: 20, display_order: 1 },
    { id: '11111111-3333-0003-0001-000000000002', restaurant_id: RESTAURANT_ID, category_id: CAT_PIZZA, name: 'Pepperoni Blast Pizza', description: 'Loaded with spicy pepperoni, mozzarella, and oregano', price: 399, image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400', is_vegetarian: false, is_available: true, is_popular: true, prep_time_minutes: 22, display_order: 2 },
    { id: '11111111-3333-0003-0001-000000000004', restaurant_id: RESTAURANT_ID, category_id: CAT_PIZZA, name: 'Paneer Tikka Pizza', description: 'Indian twist: tandoori paneer, peppers, onion, green chutney base', price: 379, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', is_vegetarian: true, is_available: true, is_popular: true, prep_time_minutes: 22, display_order: 4 },
    // Main Course
    { id: '11111111-3333-0004-0001-000000000001', restaurant_id: RESTAURANT_ID, category_id: CAT_MAIN, name: 'Butter Chicken', description: 'Classic creamy tomato-based curry with tender grilled chicken', price: 349, image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400', is_vegetarian: false, is_available: true, is_popular: true, prep_time_minutes: 25, display_order: 1 },
    { id: '11111111-3333-0004-0001-000000000002', restaurant_id: RESTAURANT_ID, category_id: CAT_MAIN, name: 'Paneer Butter Masala', description: 'Rich and creamy paneer cubes in a velvety tomato-cashew gravy', price: 299, image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400', is_vegetarian: true, is_available: true, is_popular: true, prep_time_minutes: 20, display_order: 2 },
    { id: '11111111-3333-0004-0001-000000000003', restaurant_id: RESTAURANT_ID, category_id: CAT_MAIN, name: 'Dal Makhani', description: 'Slow-cooked black lentils in a rich buttery tomato cream sauce', price: 229, image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400', is_vegetarian: true, is_available: true, is_popular: false, prep_time_minutes: 30, display_order: 3 },
    // Biryani
    { id: '11111111-3333-0005-0001-000000000001', restaurant_id: RESTAURANT_ID, category_id: CAT_BIRYANI, name: 'Chicken Dum Biryani', description: 'Slow-cooked basmati rice with tender chicken and saffron', price: 349, image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400', is_vegetarian: false, is_available: true, is_popular: true, prep_time_minutes: 40, display_order: 1 },
    { id: '11111111-3333-0005-0001-000000000002', restaurant_id: RESTAURANT_ID, category_id: CAT_BIRYANI, name: 'Veg Biryani', description: 'Fragrant basmati rice with seasonal vegetables, fried onions, and raita', price: 249, image_url: 'https://images.unsplash.com/photo-1630409351217-bc0d88cce882?w=400', is_vegetarian: true, is_available: true, is_popular: false, prep_time_minutes: 35, display_order: 2 },
    // Sides
    { id: '11111111-3333-0006-0001-000000000001', restaurant_id: RESTAURANT_ID, category_id: CAT_SIDES, name: 'Masala French Fries', description: 'Crispy fries tossed with Indian spices and chaat masala', price: 119, image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', is_vegetarian: true, is_available: true, is_popular: false, prep_time_minutes: 8, display_order: 1 },
    { id: '11111111-3333-0006-0001-000000000002', restaurant_id: RESTAURANT_ID, category_id: CAT_SIDES, name: 'Garlic Naan', description: 'Soft tandoor-baked flatbread with garlic butter and coriander', price: 59, image_url: 'https://images.unsplash.com/photo-1624374157710-3e33cce2a61e?w=400', is_vegetarian: true, is_available: true, is_popular: true, prep_time_minutes: 10, display_order: 2 },
    // Desserts
    { id: '11111111-3333-0007-0001-000000000001', restaurant_id: RESTAURANT_ID, category_id: CAT_DESSERTS, name: 'Chocolate Brownie + Ice Cream', description: 'Warm fudgy brownie served with a scoop of vanilla ice cream', price: 169, image_url: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400', is_vegetarian: true, is_available: true, is_popular: true, prep_time_minutes: 5, display_order: 1 },
    { id: '11111111-3333-0007-0001-000000000002', restaurant_id: RESTAURANT_ID, category_id: CAT_DESSERTS, name: 'Gulab Jamun (4 pcs)', description: 'Classic soft milk dumplings in rose-flavored sugar syrup', price: 99, image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', is_vegetarian: true, is_available: true, is_popular: true, prep_time_minutes: 5, display_order: 2 },
    { id: '11111111-3333-0007-0001-000000000003', restaurant_id: RESTAURANT_ID, category_id: CAT_DESSERTS, name: 'Tiramisu', description: 'Italian classic: layers of espresso-soaked ladyfingers and mascarpone cream', price: 199, image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400', is_vegetarian: true, is_available: true, is_popular: false, prep_time_minutes: 5, display_order: 3 },
    // Drinks
    { id: '11111111-3333-0008-0001-000000000001', restaurant_id: RESTAURANT_ID, category_id: CAT_DRINKS, name: 'Masala Chai', description: 'Freshly brewed tea with ginger, cardamom, and spices', price: 49, image_url: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=400', is_vegetarian: true, is_available: true, is_popular: false, prep_time_minutes: 5, display_order: 1 },
    { id: '11111111-3333-0008-0001-000000000002', restaurant_id: RESTAURANT_ID, category_id: CAT_DRINKS, name: 'Mango Lassi', description: 'Creamy blended yogurt drink with fresh mango', price: 99, image_url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400', is_vegetarian: true, is_available: true, is_popular: true, prep_time_minutes: 5, display_order: 2 },
    { id: '11111111-3333-0008-0001-000000000004', restaurant_id: RESTAURANT_ID, category_id: CAT_DRINKS, name: 'Cold Coffee', description: 'Rich espresso blended with chilled milk and a hint of chocolate', price: 129, image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', is_vegetarian: true, is_available: true, is_popular: true, prep_time_minutes: 5, display_order: 4 },
    // Mocktails
    { id: '11111111-3333-0009-0001-000000000001', restaurant_id: RESTAURANT_ID, category_id: CAT_MOCKTAILS, name: 'Virgin Mojito', description: 'Fresh mint, lime, soda water with a hint of sweetness', price: 129, image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400', is_vegetarian: true, is_available: true, is_popular: true, prep_time_minutes: 5, display_order: 1 },
    { id: '11111111-3333-0009-0001-000000000002', restaurant_id: RESTAURANT_ID, category_id: CAT_MOCKTAILS, name: 'Watermelon Cooler', description: 'Fresh watermelon juice with mint and black salt', price: 119, image_url: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400', is_vegetarian: true, is_available: true, is_popular: false, prep_time_minutes: 5, display_order: 2 },
    { id: '11111111-3333-0009-0001-000000000003', restaurant_id: RESTAURANT_ID, category_id: CAT_MOCKTAILS, name: 'Blue Lagoon', description: 'Blue curacao (non-alcoholic), sprite, and lime with a stunning blue hue', price: 149, image_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400', is_vegetarian: true, is_available: true, is_popular: true, prep_time_minutes: 5, display_order: 3 },
  ];

  // Insert via REST API in batches
  const res = await fetch(`${SUPABASE_URL}/rest/v1/menu_items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Prefer': 'resolution=ignore-duplicates'
    },
    body: JSON.stringify(menuItems)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to insert menu items: ${err}`);
  }

  console.log(`✅ ${menuItems.length} menu items inserted`);
}

async function main() {
  console.log('🚀 ZAPPY - Creating admin123@gmail.com user and seeding data...\n');
  
  try {
    // Step 1: Create user
    const userId = await createUser();
    
    // Step 2: Seed core data via REST API
    const baseUrl = SUPABASE_URL + '/rest/v1';
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Prefer': 'resolution=ignore-duplicates'
    };
    const RESTAURANT_ID = '11111111-1111-1111-1111-000000000001';

    // Insert restaurant
    let r = await fetch(`${baseUrl}/restaurants`, {
      method: 'POST', headers,
      body: JSON.stringify([{
        id: RESTAURANT_ID,
        name: 'Admin123 Restaurant',
        slug: 'admin123-restaurant',
        description: 'A premium dining experience with QR-based ordering.',
        address: '123 Food Street, Bengaluru, Karnataka 560001',
        phone: '+91 98765 43210',
        email: ADMIN_EMAIL,
        currency: 'INR', tax_rate: 5.00, service_charge_rate: 2.00,
        primary_color: '#6366F1', secondary_color: '#10B981', font_family: 'Inter',
        subscription_tier: 'pro', is_active: true, ads_enabled: true, onboarding_completed: true
      }])
    });
    if (!r.ok) console.error('Restaurant error:', await r.text());
    else console.log('✅ Restaurant created');

    // Insert role
    r = await fetch(`${baseUrl}/user_roles`, {
      method: 'POST', headers,
      body: JSON.stringify([{ user_id: userId, restaurant_id: RESTAURANT_ID, role: 'restaurant_admin' }])
    });
    if (!r.ok) console.error('Role error:', await r.text());
    else console.log('✅ Role (restaurant_admin) assigned');

    // Insert staff profile
    r = await fetch(`${baseUrl}/staff_profiles`, {
      method: 'POST', headers,
      body: JSON.stringify([{ restaurant_id: RESTAURANT_ID, user_id: userId, email: ADMIN_EMAIL, name: 'Admin Manager', is_active: true }])
    });
    if (!r.ok) console.error('Staff profile error:', await r.text());
    else console.log('✅ Staff profile created');

    // Insert categories
    const CAT_STARTERS  = '11111111-2222-0000-0001-000000000001';
    const CAT_BURGERS   = '11111111-2222-0000-0001-000000000002';
    const CAT_PIZZA     = '11111111-2222-0000-0001-000000000003';
    const CAT_MAIN      = '11111111-2222-0000-0001-000000000004';
    const CAT_BIRYANI   = '11111111-2222-0000-0001-000000000005';
    const CAT_SIDES     = '11111111-2222-0000-0001-000000000006';
    const CAT_DESSERTS  = '11111111-2222-0000-0001-000000000007';
    const CAT_DRINKS    = '11111111-2222-0000-0001-000000000008';
    const CAT_MOCKTAILS = '11111111-2222-0000-0001-000000000009';

    r = await fetch(`${baseUrl}/categories`, {
      method: 'POST', headers,
      body: JSON.stringify([
        { id: CAT_STARTERS,  restaurant_id: RESTAURANT_ID, name: 'Starters & Snacks', display_order: 1, is_active: true },
        { id: CAT_BURGERS,   restaurant_id: RESTAURANT_ID, name: 'Burgers',            display_order: 2, is_active: true },
        { id: CAT_PIZZA,     restaurant_id: RESTAURANT_ID, name: 'Pizza',              display_order: 3, is_active: true },
        { id: CAT_MAIN,      restaurant_id: RESTAURANT_ID, name: 'Main Course',        display_order: 4, is_active: true },
        { id: CAT_BIRYANI,   restaurant_id: RESTAURANT_ID, name: 'Biryani & Rice',     display_order: 5, is_active: true },
        { id: CAT_SIDES,     restaurant_id: RESTAURANT_ID, name: 'Sides & Extras',     display_order: 6, is_active: true },
        { id: CAT_DESSERTS,  restaurant_id: RESTAURANT_ID, name: 'Desserts',           display_order: 7, is_active: true },
        { id: CAT_DRINKS,    restaurant_id: RESTAURANT_ID, name: 'Hot & Cold Drinks',  display_order: 8, is_active: true },
        { id: CAT_MOCKTAILS, restaurant_id: RESTAURANT_ID, name: 'Mocktails',          display_order: 9, is_active: true },
      ])
    });
    if (!r.ok) console.error('Categories error:', await r.text());
    else console.log('✅ 9 categories created');

    // Insert tables
    r = await fetch(`${baseUrl}/tables`, {
      method: 'POST', headers,
      body: JSON.stringify(
        ['T01','T02','T03','T04','T05','T06','T07','T08','T09','T10'].map((num, i) => ({
          id: `11111111-4444-0000-0001-00000000000${i+1}`,
          restaurant_id: RESTAURANT_ID,
          table_number: num,
          capacity: i < 2 ? 2 : i < 5 ? 4 : i < 7 ? 6 : 8,
          status: 'available',
          is_active: true
        }))
      )
    });
    if (!r.ok) console.error('Tables error:', await r.text());
    else console.log('✅ 10 tables created');

    // Insert menu items
    await insertMenuItems(userId);

    console.log('\n============================================');
    console.log('✅ ALL DONE! Login credentials:');
    console.log('============================================');
    console.log('URL:      http://localhost:5173/login');
    console.log('Email:    admin123@gmail.com');
    console.log('Password: admin123');
    console.log('Role:     restaurant_admin → Redirects to /admin');
    console.log('============================================\n');
    
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.log('\n💡 If the REST API failed, please use the SQL file approach:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/copkzrwvpqfjpsyyyqdy/auth/users');
    console.log('   2. Create user: admin123@gmail.com / admin123');
    console.log('   3. Go to: https://supabase.com/dashboard/project/copkzrwvpqfjpsyyyqdy/sql/new');
    console.log('   4. Paste and run: 04_SEED_ADMIN123_USER.sql');
  }
}

main();
