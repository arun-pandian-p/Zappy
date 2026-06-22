-- 1. Fix categories SELECT policies: Allow restaurant staff to view all categories (including inactive ones)
CREATE POLICY "Restaurant staff can view all categories"
ON public.categories
FOR SELECT
TO authenticated
USING (restaurant_id = public.get_user_restaurant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 2. Fix menu_items SELECT policies: Allow restaurant staff to view all menu items (including unavailable ones)
CREATE POLICY "Restaurant staff can view all menu items"
ON public.menu_items
FOR SELECT
TO authenticated
USING (restaurant_id = public.get_user_restaurant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 3. Fix enterprise_promotions policies: Allow restaurant staff to manage their own promotions
CREATE POLICY "Restaurant staff can manage enterprise promotions"
ON public.enterprise_promotions
FOR ALL
TO authenticated
USING (restaurant_id = public.get_user_restaurant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (restaurant_id = public.get_user_restaurant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));
