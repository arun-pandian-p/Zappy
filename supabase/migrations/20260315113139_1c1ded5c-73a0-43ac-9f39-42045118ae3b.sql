
-- Drop existing storage policies for menu-images bucket and recreate properly
DROP POLICY IF EXISTS "Public can view menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete menu images" ON storage.objects;

-- Allow public read
CREATE POLICY "Public can view menu images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'menu-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload menu images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-images');

-- Allow authenticated users to update (needed for upsert)
CREATE POLICY "Authenticated users can update menu images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'menu-images');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete menu images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'menu-images');
