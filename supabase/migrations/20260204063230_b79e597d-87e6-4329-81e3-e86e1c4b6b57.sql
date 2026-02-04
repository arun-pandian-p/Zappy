-- Fix RLS policies to allow demo restaurant operations for testing
-- This enables the full application flow without requiring staff login

-- Drop existing restrictive update policies
DROP POLICY IF EXISTS "Restaurant staff can manage orders" ON orders;
DROP POLICY IF EXISTS "Restaurant staff can update invoices" ON invoices;
DROP POLICY IF EXISTS "Restaurant staff can update order items" ON order_items;

-- Create updated orders UPDATE policy with demo fallback
CREATE POLICY "Restaurant staff can manage orders"
  ON orders FOR UPDATE
  USING (
    restaurant_id = get_user_restaurant_id(auth.uid())
    OR 
    (auth.uid() IS NULL AND restaurant_id = '00000000-0000-0000-0000-000000000001')
  );

-- Create invoices ALL policy with demo fallback
CREATE POLICY "Allow invoice operations"
  ON invoices FOR ALL
  USING (
    restaurant_id = get_user_restaurant_id(auth.uid())
    OR
    (auth.uid() IS NULL AND restaurant_id = '00000000-0000-0000-0000-000000000001')
  )
  WITH CHECK (
    restaurant_id = get_user_restaurant_id(auth.uid())
    OR
    restaurant_id = '00000000-0000-0000-0000-000000000001'
  );

-- Update order_items UPDATE policy with demo fallback
DROP POLICY IF EXISTS "Restaurant staff can update order items" ON order_items;
CREATE POLICY "Restaurant staff can update order items"
  ON order_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM orders o 
      WHERE o.id = order_items.order_id 
      AND (
        o.restaurant_id = get_user_restaurant_id(auth.uid())
        OR
        (auth.uid() IS NULL AND o.restaurant_id = '00000000-0000-0000-0000-000000000001')
      )
    )
  );

-- Fix waiter_calls update policy for demo mode
DROP POLICY IF EXISTS "Restaurant staff can update waiter calls" ON waiter_calls;
CREATE POLICY "Restaurant staff can update waiter calls"
  ON waiter_calls FOR UPDATE
  USING (
    restaurant_id = get_user_restaurant_id(auth.uid())
    OR
    (auth.uid() IS NULL AND restaurant_id = '00000000-0000-0000-0000-000000000001')
  );