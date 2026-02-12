
-- Drop existing UPDATE policy on orders
DROP POLICY IF EXISTS "Restaurant staff can manage orders" ON public.orders;

-- Create new UPDATE policy that allows:
-- 1. Authenticated users whose restaurant matches
-- 2. Anon users for any active restaurant (kitchen tablets)
CREATE POLICY "Restaurant staff can manage orders" 
ON public.orders 
FOR UPDATE 
USING (
  (restaurant_id = get_user_restaurant_id(auth.uid()))
  OR 
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM restaurants r WHERE r.id = orders.restaurant_id AND r.is_active = true
  ))
);
