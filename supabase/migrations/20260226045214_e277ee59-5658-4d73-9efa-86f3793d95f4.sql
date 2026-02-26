
-- 1. Fix: Unrestricted Platform Assets Upload - restrict to super_admin only
DROP POLICY IF EXISTS "Authenticated users can upload platform assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update platform assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete platform assets" ON storage.objects;

CREATE POLICY "Super admins can upload platform assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'platform-assets' AND public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update platform assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'platform-assets' AND public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete platform assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'platform-assets' AND public.has_role(auth.uid(), 'super_admin'));

-- 2. Fix: Unrestricted Public Access to Variant/Addon Data
DROP POLICY IF EXISTS "Public can view variant groups" ON public.variant_groups;
CREATE POLICY "Public can view variant groups" ON public.variant_groups
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.menu_items mi
    JOIN public.restaurants r ON r.id = mi.restaurant_id
    WHERE mi.id = variant_groups.menu_item_id
    AND mi.is_available = true
    AND r.is_active = true
  )
);

DROP POLICY IF EXISTS "Public can view variant options" ON public.variant_options;
CREATE POLICY "Public can view variant options" ON public.variant_options
FOR SELECT USING (
  is_available = true
  AND EXISTS (
    SELECT 1 FROM public.variant_groups vg
    JOIN public.menu_items mi ON mi.id = vg.menu_item_id
    JOIN public.restaurants r ON r.id = mi.restaurant_id
    WHERE vg.id = variant_options.variant_group_id
    AND mi.is_available = true
    AND r.is_active = true
  )
);

DROP POLICY IF EXISTS "Public can view addon groups" ON public.addon_groups;
CREATE POLICY "Public can view addon groups" ON public.addon_groups
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = addon_groups.restaurant_id
    AND r.is_active = true
  )
);

DROP POLICY IF EXISTS "Public can view addon options" ON public.addon_options;
CREATE POLICY "Public can view addon options" ON public.addon_options
FOR SELECT USING (
  is_available = true
  AND EXISTS (
    SELECT 1 FROM public.addon_groups ag
    JOIN public.restaurants r ON r.id = ag.restaurant_id
    WHERE ag.id = addon_options.addon_group_id
    AND r.is_active = true
  )
);
