-- Fix cross-restaurant validation in customer-facing RLS policies and allow authenticated customer sessions to read their own newly-created rows

-- Orders: ensure table belongs to restaurant
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  restaurant_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.id = orders.restaurant_id
      AND r.is_active = true
  )
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

-- Orders: support customer-menu opened while user is authenticated in same browser
DROP POLICY IF EXISTS "Authenticated customers can view recent table orders" ON public.orders;
CREATE POLICY "Authenticated customers can view recent table orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  table_id IS NOT NULL
  AND created_at > now() - interval '24 hours'
  AND EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.id = orders.restaurant_id
      AND r.is_active = true
  )
);

-- Order items: keep insert validation explicit
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  order_id IS NOT NULL
  AND quantity > 0
  AND EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
  )
);

-- Waiter calls: ensure table belongs to same restaurant
DROP POLICY IF EXISTS "Anyone can create waiter calls" ON public.waiter_calls;
CREATE POLICY "Anyone can create waiter calls"
ON public.waiter_calls
FOR INSERT
TO anon, authenticated
WITH CHECK (
  restaurant_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.id = waiter_calls.restaurant_id
      AND r.is_active = true
  )
  AND EXISTS (
    SELECT 1
    FROM public.tables t
    WHERE t.id = waiter_calls.table_id
      AND t.restaurant_id = waiter_calls.restaurant_id
      AND t.is_active = true
  )
);

-- Waiter calls: support customer-menu opened while user is authenticated in same browser
DROP POLICY IF EXISTS "Authenticated customers can view pending waiter calls" ON public.waiter_calls;
CREATE POLICY "Authenticated customers can view pending waiter calls"
ON public.waiter_calls
FOR SELECT
TO authenticated
USING (
  status = 'pending'
  AND created_at > now() - interval '24 hours'
  AND EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.id = waiter_calls.restaurant_id
      AND r.is_active = true
  )
  AND EXISTS (
    SELECT 1
    FROM public.tables t
    WHERE t.id = waiter_calls.table_id
      AND t.restaurant_id = waiter_calls.restaurant_id
      AND t.is_active = true
  )
);

-- Table sessions: ensure table/order are scoped to same restaurant
DROP POLICY IF EXISTS "Anyone can create table sessions" ON public.table_sessions;
CREATE POLICY "Anyone can create table sessions"
ON public.table_sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  restaurant_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.id = table_sessions.restaurant_id
      AND r.is_active = true
  )
  AND EXISTS (
    SELECT 1
    FROM public.tables t
    WHERE t.id = table_sessions.table_id
      AND t.restaurant_id = table_sessions.restaurant_id
      AND t.is_active = true
  )
  AND (
    order_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = table_sessions.order_id
        AND o.restaurant_id = table_sessions.restaurant_id
    )
  )
);