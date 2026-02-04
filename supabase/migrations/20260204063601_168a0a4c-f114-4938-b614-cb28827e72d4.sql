-- Create storage bucket for menu item images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images', 
  'menu-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to menu images
CREATE POLICY "Public can view menu images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'menu-images');

-- Allow authenticated restaurant staff to upload images
CREATE POLICY "Staff can upload menu images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'menu-images'
    AND (
      auth.uid() IS NOT NULL 
      OR 
      (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000001'
    )
  );

-- Allow staff to update their images
CREATE POLICY "Staff can update menu images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'menu-images');

-- Allow staff to delete their images
CREATE POLICY "Staff can delete menu images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'menu-images');

-- Create category management policies if not exists
DROP POLICY IF EXISTS "Restaurant staff can create categories" ON categories;
DROP POLICY IF EXISTS "Restaurant staff can update categories" ON categories;
DROP POLICY IF EXISTS "Restaurant staff can delete categories" ON categories;

CREATE POLICY "Restaurant staff can create categories"
  ON categories FOR INSERT
  WITH CHECK (
    restaurant_id = get_user_restaurant_id(auth.uid())
    OR restaurant_id = '00000000-0000-0000-0000-000000000001'
  );

CREATE POLICY "Restaurant staff can update categories"
  ON categories FOR UPDATE
  USING (
    restaurant_id = get_user_restaurant_id(auth.uid())
    OR restaurant_id = '00000000-0000-0000-0000-000000000001'
  );

CREATE POLICY "Restaurant staff can delete categories"
  ON categories FOR DELETE
  USING (
    restaurant_id = get_user_restaurant_id(auth.uid())
    OR restaurant_id = '00000000-0000-0000-0000-000000000001'
  );

-- Create menu item management policies if not exists
DROP POLICY IF EXISTS "Restaurant staff can create menu items" ON menu_items;
DROP POLICY IF EXISTS "Restaurant staff can update menu items" ON menu_items;
DROP POLICY IF EXISTS "Restaurant staff can delete menu items" ON menu_items;

CREATE POLICY "Restaurant staff can create menu items"
  ON menu_items FOR INSERT
  WITH CHECK (
    restaurant_id = get_user_restaurant_id(auth.uid())
    OR restaurant_id = '00000000-0000-0000-0000-000000000001'
  );

CREATE POLICY "Restaurant staff can update menu items"
  ON menu_items FOR UPDATE
  USING (
    restaurant_id = get_user_restaurant_id(auth.uid())
    OR restaurant_id = '00000000-0000-0000-0000-000000000001'
  );

CREATE POLICY "Restaurant staff can delete menu items"
  ON menu_items FOR DELETE
  USING (
    restaurant_id = get_user_restaurant_id(auth.uid())
    OR restaurant_id = '00000000-0000-0000-0000-000000000001'
  );