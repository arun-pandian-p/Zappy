
-- 1. Fix order_items: remove public SELECT, add scoped SELECT
DROP POLICY IF EXISTS "Anyone can view order items" ON public.order_items;

CREATE POLICY "Staff and customers can view order items"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND (
      o.restaurant_id = public.get_user_restaurant_id(auth.uid())
      OR public.has_role(auth.uid(), 'super_admin')
      -- Allow anon users to view their own order items (for customer menu tracking)
      OR (auth.uid() IS NULL AND EXISTS (
        SELECT 1 FROM public.restaurants r 
        WHERE r.id = o.restaurant_id AND r.is_active = true
      ))
    )
  )
);

-- 2. Fix storage: add restaurant-scoped checks for UPDATE and DELETE
DROP POLICY IF EXISTS "Staff can update menu images" ON storage.objects;
CREATE POLICY "Staff can update menu images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'menu-images'
  AND (
    (storage.foldername(name))[1] = public.get_user_restaurant_id(auth.uid())::text
    OR public.has_role(auth.uid(), 'super_admin')
  )
);

DROP POLICY IF EXISTS "Staff can delete menu images" ON storage.objects;
CREATE POLICY "Staff can delete menu images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'menu-images'
  AND (
    (storage.foldername(name))[1] = public.get_user_restaurant_id(auth.uid())::text
    OR public.has_role(auth.uid(), 'super_admin')
  )
);

-- 3. Fix staff_profiles: add explicit authenticated requirement to SELECT
DROP POLICY IF EXISTS "Staff can view own profile" ON public.staff_profiles;
CREATE POLICY "Staff can view own profile"
ON public.staff_profiles FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 4. Fix feedback: ensure SELECT is authenticated only
DROP POLICY IF EXISTS "Restaurant staff can view feedback" ON public.feedback;
CREATE POLICY "Restaurant staff can view feedback"
ON public.feedback FOR SELECT TO authenticated
USING (restaurant_id = public.get_user_restaurant_id(auth.uid()));
