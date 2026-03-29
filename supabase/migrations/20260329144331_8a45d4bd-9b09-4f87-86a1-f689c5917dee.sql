DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  restaurant_id IS NOT NULL
  AND public.is_restaurant_active(restaurant_id)
  AND (
    table_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.tables t
      WHERE t.id = orders.table_id
        AND t.restaurant_id = orders.restaurant_id
        AND t.is_active = true
    )
  )
);

DROP POLICY IF EXISTS "Customers can view their table orders (no PII)" ON public.orders;
CREATE POLICY "Customers can view their table orders (no PII)"
ON public.orders
FOR SELECT
TO anon
USING (
  table_id IS NOT NULL
  AND created_at > (now() - interval '24 hours')
  AND public.is_restaurant_active(restaurant_id)
);

DROP POLICY IF EXISTS "Authenticated customers can view recent table orders" ON public.orders;
CREATE POLICY "Authenticated customers can view recent table orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  table_id IS NOT NULL
  AND created_at > (now() - interval '24 hours')
  AND public.is_restaurant_active(restaurant_id)
);
