-- Insert demo restaurant
INSERT INTO public.restaurants (id, name, slug, description, currency, tax_rate, service_charge_rate, is_active, primary_color, secondary_color, ads_enabled)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'QR Dine Pro Demo',
  'demo',
  'A modern dining experience with QR-based ordering',
  'INR',
  5.00,
  0.00,
  true,
  '#3B82F6',
  '#10B981',
  true
) ON CONFLICT (id) DO NOTHING;

-- Insert categories
INSERT INTO public.categories (id, restaurant_id, name, display_order, is_active) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'Starters', 1, true),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'Burgers', 2, true),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'Pizza', 3, true),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', 'Main Course', 4, true),
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000001', 'Sides', 5, true),
  ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0000-000000000001', 'Desserts', 6, true),
  ('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0000-000000000001', 'Beverages', 7, true)
ON CONFLICT (id) DO NOTHING;

-- Insert menu items with real Unsplash images
INSERT INTO public.menu_items (id, restaurant_id, category_id, name, description, price, image_url, is_vegetarian, is_available, is_popular, prep_time_minutes, display_order) VALUES
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', 'Crispy Spring Rolls', 'Golden fried vegetable spring rolls with sweet chili dip', 149, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400', true, true, true, 10, 1),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', 'Paneer Tikka', 'Marinated cottage cheese grilled to perfection', 199, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400', true, true, true, 15, 2),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', 'Classic Veg Burger', 'Crispy veggie patty with fresh vegetables and special sauce', 179, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', true, true, false, 12, 3),
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', 'Chicken Burger', 'Juicy chicken patty with cheese and lettuce', 229, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400', false, true, true, 15, 4),
  ('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000003', 'Margherita Pizza', 'Classic tomato, mozzarella and fresh basil', 299, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', true, true, true, 20, 5),
  ('00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000003', 'Pepperoni Pizza', 'Loaded with spicy pepperoni and cheese', 399, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400', false, true, false, 22, 6),
  ('00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000004', 'Butter Chicken', 'Creamy tomato-based curry with tender chicken', 349, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400', false, true, true, 25, 7),
  ('00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000004', 'Paneer Butter Masala', 'Rich and creamy paneer in tomato gravy', 299, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400', true, true, true, 20, 8),
  ('00000000-0000-0000-0002-000000000009', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000005', 'French Fries', 'Crispy golden fries with seasoning', 99, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', true, true, false, 8, 9),
  ('00000000-0000-0000-0002-000000000010', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000006', 'Chocolate Brownie', 'Warm fudgy brownie with vanilla ice cream', 149, 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400', true, true, true, 5, 10),
  ('00000000-0000-0000-0002-000000000011', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000007', 'Fresh Lime Soda', 'Refreshing lime with soda water', 59, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400', true, true, false, 3, 11),
  ('00000000-0000-0000-0002-000000000012', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000007', 'Mango Lassi', 'Creamy mango yogurt smoothie', 89, 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400', true, true, true, 5, 12)
ON CONFLICT (id) DO NOTHING;

-- Insert tables
INSERT INTO public.tables (id, restaurant_id, table_number, capacity, status, is_active) VALUES
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000001', 'T1', 2, 'available', true),
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000001', 'T2', 2, 'available', true),
  ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000001', 'T3', 4, 'available', true),
  ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0000-000000000001', 'T4', 4, 'available', true),
  ('00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000001', 'T5', 6, 'available', true),
  ('00000000-0000-0000-0003-000000000006', '00000000-0000-0000-0000-000000000001', 'T6', 6, 'available', true),
  ('00000000-0000-0000-0003-000000000007', '00000000-0000-0000-0000-000000000001', 'T7', 8, 'available', true),
  ('00000000-0000-0000-0003-000000000008', '00000000-0000-0000-0000-000000000001', 'T8', 8, 'available', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample orders
INSERT INTO public.orders (id, restaurant_id, table_id, order_number, status, payment_status, subtotal, tax_amount, service_charge, total_amount) VALUES
  ('00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000001', 1001, 'pending', 'pending', 348, 17.40, 0, 365.40),
  ('00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000003', 1002, 'preparing', 'pending', 528, 26.40, 0, 554.40),
  ('00000000-0000-0000-0004-000000000003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000005', 1003, 'ready', 'pending', 747, 37.35, 0, 784.35)
ON CONFLICT (id) DO NOTHING;

-- Insert order items
INSERT INTO public.order_items (id, order_id, menu_item_id, name, quantity, price, status) VALUES
  ('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0002-000000000001', 'Crispy Spring Rolls', 1, 149, 'pending'),
  ('00000000-0000-0000-0005-000000000002', '00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0002-000000000002', 'Paneer Tikka', 1, 199, 'pending'),
  ('00000000-0000-0000-0005-000000000003', '00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0002-000000000005', 'Margherita Pizza', 1, 299, 'preparing'),
  ('00000000-0000-0000-0005-000000000004', '00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0002-000000000004', 'Chicken Burger', 1, 229, 'preparing'),
  ('00000000-0000-0000-0005-000000000005', '00000000-0000-0000-0004-000000000003', '00000000-0000-0000-0002-000000000007', 'Butter Chicken', 1, 349, 'ready'),
  ('00000000-0000-0000-0005-000000000006', '00000000-0000-0000-0004-000000000003', '00000000-0000-0000-0002-000000000008', 'Paneer Butter Masala', 1, 299, 'ready'),
  ('00000000-0000-0000-0005-000000000007', '00000000-0000-0000-0004-000000000003', '00000000-0000-0000-0002-000000000009', 'French Fries', 1, 99, 'ready')
ON CONFLICT (id) DO NOTHING;

-- Insert sample ad
INSERT INTO public.ads (id, title, description, image_url, is_active, starts_at)
VALUES (
  '00000000-0000-0000-0006-000000000001',
  'Weekend Special: 20% Off',
  'Get 20% off on all pizzas this weekend!',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
  true,
  now()
) ON CONFLICT (id) DO NOTHING;