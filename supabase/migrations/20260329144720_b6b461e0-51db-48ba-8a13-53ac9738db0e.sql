-- Fix addon_groups public SELECT
DROP POLICY IF EXISTS "Public can view addon groups" ON public.addon_groups;
CREATE POLICY "Public can view addon groups" ON public.addon_groups
FOR SELECT TO public
USING (public.is_restaurant_active(restaurant_id));

-- Fix addon_options public SELECT
DROP POLICY IF EXISTS "Public can view addon options" ON public.addon_options;
CREATE POLICY "Public can view addon options" ON public.addon_options
FOR SELECT TO public
USING (
  is_available = true
  AND EXISTS (
    SELECT 1 FROM addon_groups ag
    WHERE ag.id = addon_options.addon_group_id
    AND public.is_restaurant_active(ag.restaurant_id)
  )
);

-- Fix variant_groups public SELECT
DROP POLICY IF EXISTS "Public can view variant groups" ON public.variant_groups;
CREATE POLICY "Public can view variant groups" ON public.variant_groups
FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM menu_items mi
    WHERE mi.id = variant_groups.menu_item_id
    AND mi.is_available = true
    AND public.is_restaurant_active(mi.restaurant_id)
  )
);

-- Fix variant_options public SELECT
DROP POLICY IF EXISTS "Public can view variant options" ON public.variant_options;
CREATE POLICY "Public can view variant options" ON public.variant_options
FOR SELECT TO public
USING (
  is_available = true
  AND EXISTS (
    SELECT 1 FROM variant_groups vg
    JOIN menu_items mi ON mi.id = vg.menu_item_id
    WHERE vg.id = variant_options.variant_group_id
    AND mi.is_available = true
    AND public.is_restaurant_active(mi.restaurant_id)
  )
);

-- Fix pages public SELECT
DROP POLICY IF EXISTS "Public can view published pages" ON public.pages;
CREATE POLICY "Public can view published pages" ON public.pages
FOR SELECT TO public
USING (
  is_published = true
  AND public.is_restaurant_active(tenant_id)
);