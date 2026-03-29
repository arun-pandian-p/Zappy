
-- Fix order_items INSERT policy: remove the EXISTS check on orders
-- The foreign key constraint already ensures referential integrity
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  order_id IS NOT NULL
  AND quantity > 0
);

-- Make header/category/footer ads target ALL restaurants (null = all)
UPDATE public.ads
SET target_restaurants = NULL
WHERE is_active = true
AND placement_type IN ('header_banner', 'category_divider', 'footer_banner');
