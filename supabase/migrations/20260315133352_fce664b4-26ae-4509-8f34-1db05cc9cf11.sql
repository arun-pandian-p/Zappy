
-- FIX 1: Remove anonymous UPDATE access from orders
DROP POLICY IF EXISTS "Restaurant staff can manage orders" ON public.orders;
CREATE POLICY "Restaurant staff can manage orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  (restaurant_id = get_user_restaurant_id(auth.uid()))
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- FIX 2: Remove overly permissive anon SELECT on orders
DROP POLICY IF EXISTS "Customers can view orders for active restaurants" ON public.orders;
CREATE POLICY "Customers can view orders for active restaurants"
ON public.orders
FOR SELECT
TO anon
USING (
  (table_id IS NOT NULL)
  AND (EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = orders.restaurant_id AND r.is_active = true
  ))
  AND (created_at > now() - interval '24 hours')
);

-- FIX 3: Remove public SELECT that exposes restaurant PII
DROP POLICY IF EXISTS "Public can view active restaurants via view" ON public.restaurants;
