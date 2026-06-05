-- ============================================================
-- ZAPPY - STEP 04: SEED ADMIN USER + FULL RESTAURANT DATA
-- Email:    admin123@gmail.com
-- Password: admin123
-- Role:     restaurant_admin
-- ============================================================
-- HOW TO USE:
-- 1. First, go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" > "Create new user"
-- 3. Enter Email: admin123@gmail.com | Password: admin123
-- 4. Click "Create User" and NOTE the UUID shown
-- 5. Come back here and replace the placeholder below with
--    that UUID, then run this entire script in SQL Editor.
-- ============================================================

DO $$
DECLARE
  -- =====================================================
  -- STEP 1: Set the UUID of the user you just created
  --         in Supabase Authentication > Users
  -- =====================================================
  v_admin_user_id UUID := (
    SELECT id FROM auth.users WHERE email = 'admin123@gmail.com' LIMIT 1
  );
  v_admin_email TEXT := 'admin123@gmail.com';

  -- Restaurant + data UUIDs (fixed so everything stays consistent)
  v_restaurant_id UUID := '11111111-1111-1111-1111-000000000001';

  -- Category UUIDs
  v_cat_starters  UUID := '11111111-2222-0000-0001-000000000001';
  v_cat_burgers   UUID := '11111111-2222-0000-0001-000000000002';
  v_cat_pizza     UUID := '11111111-2222-0000-0001-000000000003';
  v_cat_main      UUID := '11111111-2222-0000-0001-000000000004';
  v_cat_biryani   UUID := '11111111-2222-0000-0001-000000000005';
  v_cat_sides     UUID := '11111111-2222-0000-0001-000000000006';
  v_cat_desserts  UUID := '11111111-2222-0000-0001-000000000007';
  v_cat_drinks    UUID := '11111111-2222-0000-0001-000000000008';
  v_cat_mocktails UUID := '11111111-2222-0000-0001-000000000009';

BEGIN

  -- =========================================================
  -- GUARD: Make sure the user exists in auth.users
  -- =========================================================
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION '❌ User admin123@gmail.com not found in auth.users. '
      'Please create the user in Supabase Dashboard > Authentication > Users first, then re-run this script.';
  END IF;

  RAISE NOTICE '✅ Found auth user: % (UUID: %)', v_admin_email, v_admin_user_id;

  -- =========================================================
  -- SECTION A: RESTAURANT
  -- =========================================================
  INSERT INTO public.restaurants (
    id, name, slug, description, address, phone, email,
    currency, tax_rate, service_charge_rate,
    primary_color, secondary_color, font_family,
    subscription_tier, is_active, ads_enabled, onboarding_completed
  ) VALUES (
    v_restaurant_id,
    'Admin123 Restaurant',
    'admin123-restaurant',
    'A premium dining experience with QR-based ordering. Fresh ingredients, bold flavors.',
    '123 Food Street, Bengaluru, Karnataka 560001',
    '+91 98765 43210',
    v_admin_email,
    'INR', 5.00, 2.00,
    '#6366F1', '#10B981', 'Inter',
    'pro', true, true, true
  ) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    is_active = true,
    onboarding_completed = true;

  RAISE NOTICE '✅ Restaurant created/updated: Admin123 Restaurant';

  -- =========================================================
  -- SECTION B: ASSIGN ROLE (restaurant_admin)
  -- =========================================================
  INSERT INTO public.user_roles (user_id, restaurant_id, role)
  VALUES (v_admin_user_id, v_restaurant_id, 'restaurant_admin')
  ON CONFLICT (user_id, restaurant_id, role) DO NOTHING;

  RAISE NOTICE '✅ Role assigned: restaurant_admin for %', v_admin_email;

  -- =========================================================
  -- SECTION C: STAFF PROFILE
  -- =========================================================
  INSERT INTO public.staff_profiles (restaurant_id, user_id, email, name, is_active)
  VALUES (v_restaurant_id, v_admin_user_id, v_admin_email, 'Admin Manager', true)
  ON CONFLICT (user_id) DO UPDATE SET name = 'Admin Manager', is_active = true;

  RAISE NOTICE '✅ Staff profile created for %', v_admin_email;

  -- =========================================================
  -- SECTION D: CATEGORIES (9 Categories)
  -- =========================================================
  INSERT INTO public.categories (id, restaurant_id, name, display_order, is_active) VALUES
    (v_cat_starters,  v_restaurant_id, 'Starters & Snacks', 1, true),
    (v_cat_burgers,   v_restaurant_id, 'Burgers',            2, true),
    (v_cat_pizza,     v_restaurant_id, 'Pizza',              3, true),
    (v_cat_main,      v_restaurant_id, 'Main Course',        4, true),
    (v_cat_biryani,   v_restaurant_id, 'Biryani & Rice',     5, true),
    (v_cat_sides,     v_restaurant_id, 'Sides & Extras',     6, true),
    (v_cat_desserts,  v_restaurant_id, 'Desserts',           7, true),
    (v_cat_drinks,    v_restaurant_id, 'Hot & Cold Drinks',  8, true),
    (v_cat_mocktails, v_restaurant_id, 'Mocktails',          9, true)
  ON CONFLICT (name, restaurant_id) DO NOTHING;

  RAISE NOTICE '✅ Categories seeded (9 categories)';

  -- =========================================================
  -- SECTION E: MENU ITEMS (30+ Items)
  -- =========================================================

  -- === STARTERS & SNACKS ===
  INSERT INTO public.menu_items (id, restaurant_id, category_id, name, description, price, image_url, is_vegetarian, is_available, is_popular, prep_time_minutes, display_order) VALUES
    ('11111111-3333-0001-0001-000000000001', v_restaurant_id, v_cat_starters,
     'Crispy Spring Rolls', 'Golden fried vegetable spring rolls served with sweet chili sauce', 149,
     'https://images.unsplash.com/photo-1544025162-d76694265947?w=400', true, true, true, 10, 1),
    ('11111111-3333-0001-0001-000000000002', v_restaurant_id, v_cat_starters,
     'Paneer Tikka', 'Marinated cottage cheese cubes grilled in tandoor with bell peppers & onions', 249,
     'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400', true, true, true, 20, 2),
    ('11111111-3333-0001-0001-000000000003', v_restaurant_id, v_cat_starters,
     'Chicken Wings BBQ', 'Crispy chicken wings tossed in smoky BBQ sauce', 299,
     'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400', false, true, true, 18, 3),
    ('11111111-3333-0001-0001-000000000004', v_restaurant_id, v_cat_starters,
     'Loaded Nachos', 'Tortilla chips loaded with cheese sauce, jalapeños, salsa, and sour cream', 199,
     'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400', true, true, false, 10, 4),
    ('11111111-3333-0001-0001-000000000005', v_restaurant_id, v_cat_starters,
     'Veg Manchurian', 'Crispy vegetable balls in a spicy Indo-Chinese sauce', 179,
     'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400', true, true, false, 15, 5)
  ON CONFLICT (id) DO NOTHING;

  -- === BURGERS ===
  INSERT INTO public.menu_items (id, restaurant_id, category_id, name, description, price, image_url, is_vegetarian, is_available, is_popular, prep_time_minutes, display_order) VALUES
    ('11111111-3333-0002-0001-000000000001', v_restaurant_id, v_cat_burgers,
     'Classic Veg Burger', 'Crispy veggie patty, fresh lettuce, tomato, onion, and our secret sauce', 179,
     'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', true, true, false, 12, 1),
    ('11111111-3333-0002-0001-000000000002', v_restaurant_id, v_cat_burgers,
     'Zappy Chicken Burger', 'Juicy grilled chicken patty with cheese, jalapeños and sriracha mayo', 249,
     'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400', false, true, true, 15, 2),
    ('11111111-3333-0002-0001-000000000003', v_restaurant_id, v_cat_burgers,
     'BBQ Bacon Smash Burger', 'Double smash patty with crispy bacon, cheddar, pickles, and BBQ sauce', 349,
     'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400', false, true, true, 18, 3),
    ('11111111-3333-0002-0001-000000000004', v_restaurant_id, v_cat_burgers,
     'Mushroom Swiss Burger', 'Sautéed mushrooms, Swiss cheese, garlic aioli on a brioche bun', 279,
     'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400', true, true, false, 15, 4)
  ON CONFLICT (id) DO NOTHING;

  -- === PIZZA ===
  INSERT INTO public.menu_items (id, restaurant_id, category_id, name, description, price, image_url, is_vegetarian, is_available, is_popular, prep_time_minutes, display_order) VALUES
    ('11111111-3333-0003-0001-000000000001', v_restaurant_id, v_cat_pizza,
     'Margherita Pizza', 'Classic San Marzano tomato sauce, fresh mozzarella, and basil', 299,
     'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', true, true, true, 20, 1),
    ('11111111-3333-0003-0001-000000000002', v_restaurant_id, v_cat_pizza,
     'Pepperoni Blast Pizza', 'Loaded with spicy pepperoni, mozzarella, and oregano', 399,
     'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400', false, true, true, 22, 2),
    ('11111111-3333-0003-0001-000000000003', v_restaurant_id, v_cat_pizza,
     'BBQ Chicken Pizza', 'Smoky BBQ sauce base, grilled chicken, red onions, and jalapeños', 449,
     'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', false, true, false, 22, 3),
    ('11111111-3333-0003-0001-000000000004', v_restaurant_id, v_cat_pizza,
     'Paneer Tikka Pizza', 'Indian twist: tandoori paneer, peppers, onion, green chutney base', 379,
     'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', true, true, true, 22, 4)
  ON CONFLICT (id) DO NOTHING;

  -- === MAIN COURSE ===
  INSERT INTO public.menu_items (id, restaurant_id, category_id, name, description, price, image_url, is_vegetarian, is_available, is_popular, prep_time_minutes, display_order) VALUES
    ('11111111-3333-0004-0001-000000000001', v_restaurant_id, v_cat_main,
     'Butter Chicken', 'Classic creamy tomato-based curry with tender grilled chicken', 349,
     'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400', false, true, true, 25, 1),
    ('11111111-3333-0004-0001-000000000002', v_restaurant_id, v_cat_main,
     'Paneer Butter Masala', 'Rich and creamy paneer cubes in a velvety tomato-cashew gravy', 299,
     'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400', true, true, true, 20, 2),
    ('11111111-3333-0004-0001-000000000003', v_restaurant_id, v_cat_main,
     'Dal Makhani', 'Slow-cooked black lentils in a rich buttery tomato cream sauce', 229,
     'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400', true, true, false, 30, 3),
    ('11111111-3333-0004-0001-000000000004', v_restaurant_id, v_cat_main,
     'Mutton Rogan Josh', 'Slow-braised mutton in aromatic Kashmiri spices', 449,
     'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400', false, true, true, 35, 4),
    ('11111111-3333-0004-0001-000000000005', v_restaurant_id, v_cat_main,
     'Kadai Paneer', 'Paneer cooked with bell peppers, tomatoes and freshly ground kadai masala', 279,
     'https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?w=400', true, true, false, 22, 5)
  ON CONFLICT (id) DO NOTHING;

  -- === BIRYANI & RICE ===
  INSERT INTO public.menu_items (id, restaurant_id, category_id, name, description, price, image_url, is_vegetarian, is_available, is_popular, prep_time_minutes, display_order) VALUES
    ('11111111-3333-0005-0001-000000000001', v_restaurant_id, v_cat_biryani,
     'Chicken Dum Biryani', 'Slow-cooked basmati rice with tender chicken and saffron', 349,
     'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400', false, true, true, 40, 1),
    ('11111111-3333-0005-0001-000000000002', v_restaurant_id, v_cat_biryani,
     'Veg Biryani', 'Fragrant basmati rice with seasonal vegetables, fried onions, and raita', 249,
     'https://images.unsplash.com/photo-1630409351217-bc0d88cce882?w=400', true, true, false, 35, 2),
    ('11111111-3333-0005-0001-000000000003', v_restaurant_id, v_cat_biryani,
     'Mutton Biryani', 'Royal slow-cooked mutton biryani with whole spices and caramelized onions', 449,
     'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400', false, true, true, 45, 3),
    ('11111111-3333-0005-0001-000000000004', v_restaurant_id, v_cat_biryani,
     'Steamed Rice + Dal Tadka', 'Simple comfort food: steamed basmati rice with dal tadka', 179,
     'https://images.unsplash.com/photo-1547592180-85f173990554?w=400', true, true, false, 20, 4)
  ON CONFLICT (id) DO NOTHING;

  -- === SIDES & EXTRAS ===
  INSERT INTO public.menu_items (id, restaurant_id, category_id, name, description, price, image_url, is_vegetarian, is_available, is_popular, prep_time_minutes, display_order) VALUES
    ('11111111-3333-0006-0001-000000000001', v_restaurant_id, v_cat_sides,
     'Masala French Fries', 'Crispy fries tossed with Indian spices and chaat masala', 119,
     'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', true, true, false, 8, 1),
    ('11111111-3333-0006-0001-000000000002', v_restaurant_id, v_cat_sides,
     'Garlic Naan', 'Soft tandoor-baked flatbread with garlic butter and coriander', 59,
     'https://images.unsplash.com/photo-1624374157710-3e33cce2a61e?w=400', true, true, true, 10, 2),
    ('11111111-3333-0006-0001-000000000003', v_restaurant_id, v_cat_sides,
     'Butter Roti (2 pcs)', 'Soft whole wheat rotis with a brush of butter', 39,
     'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400', true, true, false, 8, 3),
    ('11111111-3333-0006-0001-000000000004', v_restaurant_id, v_cat_sides,
     'Mix Raita', 'Chilled yogurt with cucumber, tomato, and mint', 69,
     'https://images.unsplash.com/photo-1604952563609-5a3d1b6b3c3e?w=400', true, true, false, 5, 4)
  ON CONFLICT (id) DO NOTHING;

  -- === DESSERTS ===
  INSERT INTO public.menu_items (id, restaurant_id, category_id, name, description, price, image_url, is_vegetarian, is_available, is_popular, prep_time_minutes, display_order) VALUES
    ('11111111-3333-0007-0001-000000000001', v_restaurant_id, v_cat_desserts,
     'Chocolate Brownie + Ice Cream', 'Warm fudgy brownie served with a scoop of vanilla ice cream', 169,
     'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400', true, true, true, 5, 1),
    ('11111111-3333-0007-0001-000000000002', v_restaurant_id, v_cat_desserts,
     'Gulab Jamun (4 pcs)', 'Classic soft milk dumplings in rose-flavored sugar syrup', 99,
     'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', true, true, true, 5, 2),
    ('11111111-3333-0007-0001-000000000003', v_restaurant_id, v_cat_desserts,
     'Tiramisu', 'Italian classic: layers of espresso-soaked ladyfingers and mascarpone cream', 199,
     'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400', true, true, false, 5, 3),
    ('11111111-3333-0007-0001-000000000004', v_restaurant_id, v_cat_desserts,
     'Kulfi (Mango)', 'Traditional frozen Indian dessert with mango and pistachio', 89,
     'https://images.unsplash.com/photo-1625398407796-82d0781cc4f0?w=400', true, true, false, 3, 4)
  ON CONFLICT (id) DO NOTHING;

  -- === HOT & COLD DRINKS ===
  INSERT INTO public.menu_items (id, restaurant_id, category_id, name, description, price, image_url, is_vegetarian, is_available, is_popular, prep_time_minutes, display_order) VALUES
    ('11111111-3333-0008-0001-000000000001', v_restaurant_id, v_cat_drinks,
     'Masala Chai', 'Freshly brewed tea with ginger, cardamom, and spices', 49,
     'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=400', true, true, false, 5, 1),
    ('11111111-3333-0008-0001-000000000002', v_restaurant_id, v_cat_drinks,
     'Mango Lassi', 'Creamy blended yogurt drink with fresh mango', 99,
     'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400', true, true, true, 5, 2),
    ('11111111-3333-0008-0001-000000000003', v_restaurant_id, v_cat_drinks,
     'Fresh Lime Soda (Sweet/Salt)', 'Refreshing lime with soda, your choice of sweet or salty', 69,
     'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400', true, true, false, 3, 3),
    ('11111111-3333-0008-0001-000000000004', v_restaurant_id, v_cat_drinks,
     'Cold Coffee', 'Rich espresso blended with chilled milk and a hint of chocolate', 129,
     'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', true, true, true, 5, 4)
  ON CONFLICT (id) DO NOTHING;

  -- === MOCKTAILS ===
  INSERT INTO public.menu_items (id, restaurant_id, category_id, name, description, price, image_url, is_vegetarian, is_available, is_popular, prep_time_minutes, display_order) VALUES
    ('11111111-3333-0009-0001-000000000001', v_restaurant_id, v_cat_mocktails,
     'Virgin Mojito', 'Fresh mint, lime, soda water with a hint of sweetness', 129,
     'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400', true, true, true, 5, 1),
    ('11111111-3333-0009-0001-000000000002', v_restaurant_id, v_cat_mocktails,
     'Watermelon Cooler', 'Fresh watermelon juice with mint and black salt', 119,
     'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400', true, true, false, 5, 2),
    ('11111111-3333-0009-0001-000000000003', v_restaurant_id, v_cat_mocktails,
     'Blue Lagoon', 'Blue curacao (non-alcoholic), sprite, and lime with a stunning blue hue', 149,
     'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400', true, true, true, 5, 3),
    ('11111111-3333-0009-0001-000000000004', v_restaurant_id, v_cat_mocktails,
     'Strawberry Lemonade', 'Fresh strawberry puree with squeezed lemon and sparkling water', 139,
     'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=400', true, true, false, 5, 4)
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✅ Menu items seeded (30+ items across 9 categories)';

  -- =========================================================
  -- SECTION F: TABLES (10 Restaurant Tables)
  -- =========================================================
  INSERT INTO public.tables (id, restaurant_id, table_number, capacity, status, is_active) VALUES
    ('11111111-4444-0000-0001-000000000001', v_restaurant_id, 'T01', 2, 'available', true),
    ('11111111-4444-0000-0001-000000000002', v_restaurant_id, 'T02', 2, 'available', true),
    ('11111111-4444-0000-0001-000000000003', v_restaurant_id, 'T03', 4, 'available', true),
    ('11111111-4444-0000-0001-000000000004', v_restaurant_id, 'T04', 4, 'available', true),
    ('11111111-4444-0000-0001-000000000005', v_restaurant_id, 'T05', 4, 'available', true),
    ('11111111-4444-0000-0001-000000000006', v_restaurant_id, 'T06', 6, 'available', true),
    ('11111111-4444-0000-0001-000000000007', v_restaurant_id, 'T07', 6, 'available', true),
    ('11111111-4444-0000-0001-000000000008', v_restaurant_id, 'T08', 8, 'available', true),
    ('11111111-4444-0000-0001-000000000009', v_restaurant_id, 'T09', 8, 'available', true),
    ('11111111-4444-0000-0001-000000000010', v_restaurant_id, 'T10', 10, 'available', true)
  ON CONFLICT (restaurant_id, table_number) DO NOTHING;

  RAISE NOTICE '✅ Tables seeded (T01–T10)';

  -- =========================================================
  -- SECTION G: SAMPLE ORDERS (for dashboard demo)
  -- =========================================================
  INSERT INTO public.orders (id, restaurant_id, table_id, status, payment_status, subtotal, tax_amount, service_charge, total_amount) VALUES
    ('11111111-5555-0001-0001-000000000001', v_restaurant_id, '11111111-4444-0000-0001-000000000003',
     'preparing', 'pending', 598, 29.90, 11.96, 639.86),
    ('11111111-5555-0001-0001-000000000002', v_restaurant_id, '11111111-4444-0000-0001-000000000005',
     'ready', 'pending', 748, 37.40, 14.96, 800.36),
    ('11111111-5555-0001-0001-000000000003', v_restaurant_id, '11111111-4444-0000-0001-000000000007',
     'completed', 'paid', 999, 49.95, 19.98, 1068.93)
  ON CONFLICT (id) DO NOTHING;

  -- Sample order items
  INSERT INTO public.order_items (id, order_id, menu_item_id, name, quantity, price, status) VALUES
    ('11111111-5555-0002-0001-000000000001', '11111111-5555-0001-0001-000000000001', '11111111-3333-0001-0001-000000000002', 'Paneer Tikka', 1, 249, 'preparing'),
    ('11111111-5555-0002-0001-000000000002', '11111111-5555-0001-0001-000000000001', '11111111-3333-0003-0001-000000000001', 'Margherita Pizza', 1, 299, 'preparing'),
    ('11111111-5555-0002-0001-000000000003', '11111111-5555-0001-0001-000000000002', '11111111-3333-0004-0001-000000000001', 'Butter Chicken', 1, 349, 'ready'),
    ('11111111-5555-0002-0001-000000000004', '11111111-5555-0001-0001-000000000002', '11111111-3333-0005-0001-000000000001', 'Chicken Dum Biryani', 1, 349, 'ready'),
    ('11111111-5555-0002-0001-000000000005', '11111111-5555-0001-0001-000000000003', '11111111-3333-0004-0001-000000000002', 'Paneer Butter Masala', 2, 299, 'completed'),
    ('11111111-5555-0002-0001-000000000006', '11111111-5555-0001-0001-000000000003', '11111111-3333-0006-0001-000000000002', 'Garlic Naan', 3, 59, 'completed'),
    ('11111111-5555-0002-0001-000000000007', '11111111-5555-0001-0001-000000000003', '11111111-3333-0007-0001-000000000001', 'Chocolate Brownie + Ice Cream', 1, 169, 'completed')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✅ Sample orders and order items seeded';

  -- =========================================================
  -- SECTION H: SUBSCRIPTION PLANS (Platform-wide)
  -- =========================================================
  INSERT INTO public.subscription_plans (id, name, tier, price_monthly, price_yearly, max_tables, max_orders_per_month, features, is_active) VALUES
    (gen_random_uuid(), 'Free', 'free',        0.00,    0.00,    5,    100,   '{"qr_menu":true,"basic_analytics":true}', true),
    (gen_random_uuid(), 'Pro', 'pro',        999.00, 9990.00,   25,  5000,   '{"qr_menu":true,"basic_analytics":true,"advanced_analytics":true,"kitchen_display":true,"waiter_app":true,"coupons":true}', true),
    (gen_random_uuid(), 'Enterprise', 'enterprise', 2499.00, 24990.00, 9999, 999999, '{"qr_menu":true,"basic_analytics":true,"advanced_analytics":true,"kitchen_display":true,"waiter_app":true,"coupons":true,"white_label":true,"priority_support":true,"api_access":true}', true)
  ON CONFLICT (tier) DO NOTHING;

  RAISE NOTICE '✅ Subscription plans seeded (Free/Pro/Enterprise)';

  -- =========================================================
  -- SECTION I: PLATFORM SETTINGS
  -- =========================================================
  INSERT INTO public.platform_settings (platform_name, logo_url, primary_color, secondary_color, creator_email)
  VALUES ('Zappy - QR Dine Pro', NULL, '#6366F1', '#10B981', 'zappyscan@gmail.com')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Platform settings seeded';

  -- =========================================================
  -- SECTION J: SAMPLE AD
  -- =========================================================
  INSERT INTO public.ads (id, title, description, image_url, is_active, starts_at, placement_type) VALUES
    ('11111111-9999-0001-0001-000000000001',
     '🍕 Weekend Special: 20% Off All Pizzas!',
     'Get 20% off on all pizza orders this weekend. Use code PIZZA20.',
     'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
     true, now(), 'popup_offer')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✅ Sample ad created';

  -- =========================================================
  -- SECTION K: LOG THE ACTION
  -- =========================================================
  INSERT INTO public.system_logs (actor_id, actor_email, action, entity_type, entity_id, details)
  VALUES (v_admin_user_id, v_admin_email, 'seed_restaurant_admin', 'user', v_admin_user_id::text,
    jsonb_build_object(
      'note', 'Admin user admin123@gmail.com seeded as restaurant_admin',
      'restaurant_id', v_restaurant_id,
      'restaurant_name', 'Admin123 Restaurant',
      'menu_items', 30,
      'tables', 10,
      'categories', 9
    ));

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ ALL SEED DATA CREATED SUCCESSFULLY!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Login URL: http://localhost:5173/login';
  RAISE NOTICE 'Email:     admin123@gmail.com';
  RAISE NOTICE 'Password:  admin123';
  RAISE NOTICE 'Role:      restaurant_admin';
  RAISE NOTICE 'Dashboard: /admin';
  RAISE NOTICE '============================================';

END $$;
