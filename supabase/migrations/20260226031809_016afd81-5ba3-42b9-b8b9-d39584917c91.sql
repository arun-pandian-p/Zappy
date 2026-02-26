
-- Remove the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view orders by restaurant" ON public.orders;

-- Allow authenticated restaurant staff and super admins to view orders
CREATE POLICY "Restaurant staff can view orders"
ON public.orders FOR SELECT TO authenticated
USING (
  restaurant_id = public.get_user_restaurant_id(auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Allow anonymous users to view orders only for active restaurants
-- (needed for customer QR ordering flow / order status tracking)
CREATE POLICY "Customers can view orders for active restaurants"
ON public.orders FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = orders.restaurant_id AND r.is_active = true
  )
);
