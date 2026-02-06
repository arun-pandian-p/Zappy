-- Tighten public INSERT policies to avoid overly permissive WITH CHECK (true)

-- orders
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
    WHERE r.id = restaurant_id
      AND r.is_active = true
  )
  AND (
    table_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.tables t
      WHERE t.id = table_id
        AND t.restaurant_id = restaurant_id
        AND t.is_active = true
    )
  )
);

-- order_items
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
    WHERE o.id = order_id
  )
);

-- customer_events
DROP POLICY IF EXISTS "Anyone can create customer events" ON public.customer_events;
CREATE POLICY "Anyone can create customer events"
ON public.customer_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  restaurant_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.id = restaurant_id
      AND r.is_active = true
  )
  AND (
    table_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.tables t
      WHERE t.id = table_id
        AND t.restaurant_id = restaurant_id
        AND t.is_active = true
    )
  )
);

-- feedback
DROP POLICY IF EXISTS "Anyone can create feedback" ON public.feedback;
CREATE POLICY "Anyone can create feedback"
ON public.feedback
FOR INSERT
TO anon, authenticated
WITH CHECK (
  restaurant_id IS NOT NULL
  AND rating BETWEEN 1 AND 5
  AND EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.id = restaurant_id
      AND r.is_active = true
  )
  AND (
    table_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.tables t
      WHERE t.id = table_id
        AND t.restaurant_id = restaurant_id
        AND t.is_active = true
    )
  )
  AND (
    order_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_id
        AND o.restaurant_id = restaurant_id
    )
  )
);

-- waiter_calls
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
    WHERE r.id = restaurant_id
      AND r.is_active = true
  )
  AND EXISTS (
    SELECT 1
    FROM public.tables t
    WHERE t.id = table_id
      AND t.restaurant_id = restaurant_id
      AND t.is_active = true
  )
);

-- table_sessions
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
    WHERE r.id = restaurant_id
      AND r.is_active = true
  )
  AND EXISTS (
    SELECT 1
    FROM public.tables t
    WHERE t.id = table_id
      AND t.restaurant_id = restaurant_id
      AND t.is_active = true
  )
  AND (
    order_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_id
        AND o.restaurant_id = restaurant_id
    )
  )
);

-- analytics_events
DROP POLICY IF EXISTS "Anyone can create analytics events" ON public.analytics_events;
CREATE POLICY "Anyone can create analytics events"
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_type IS NOT NULL
  AND (restaurant_id IS NULL OR EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.id = restaurant_id
      AND r.is_active = true
  ))
);
