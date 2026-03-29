
-- Step 1: Create SECURITY DEFINER function to check restaurant active status
CREATE OR REPLACE FUNCTION public.is_restaurant_active(_restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = _restaurant_id AND is_active = true
  )
$$;

-- Step 2: Fix OFFERS SELECT policy
DROP POLICY IF EXISTS "Public can view active offers" ON public.offers;
CREATE POLICY "Public can view active offers" ON public.offers
FOR SELECT TO public
USING (
  is_active = true
  AND (start_date IS NULL OR start_date <= now())
  AND (end_date IS NULL OR end_date >= now())
  AND is_restaurant_active(restaurant_id)
);

-- Step 3: Fix ORDERS INSERT policy — need to check current policy first
-- The orders table INSERT policy likely has the same EXISTS pattern
-- Let's recreate it using the helper function

-- Fix feedback INSERT policy
DROP POLICY IF EXISTS "Anyone can create feedback" ON public.feedback;
CREATE POLICY "Anyone can create feedback" ON public.feedback
FOR INSERT TO anon, authenticated
WITH CHECK (
  restaurant_id IS NOT NULL
  AND rating >= 1 AND rating <= 5
  AND is_restaurant_active(restaurant_id)
  AND (table_id IS NULL OR EXISTS (
    SELECT 1 FROM tables t WHERE t.id = feedback.table_id AND t.is_active = true
  ))
  AND (order_id IS NULL OR EXISTS (
    SELECT 1 FROM orders o WHERE o.id = feedback.order_id
  ))
);

-- Fix customer_events INSERT policy
DROP POLICY IF EXISTS "Anyone can create customer events" ON public.customer_events;
CREATE POLICY "Anyone can create customer events" ON public.customer_events
FOR INSERT TO anon, authenticated
WITH CHECK (
  restaurant_id IS NOT NULL
  AND is_restaurant_active(restaurant_id)
  AND (table_id IS NULL OR EXISTS (
    SELECT 1 FROM tables t WHERE t.id = customer_events.table_id AND t.is_active = true
  ))
);

-- Fix waiter_calls INSERT policy
DROP POLICY IF EXISTS "Anyone can create waiter calls" ON public.waiter_calls;
CREATE POLICY "Anyone can create waiter calls" ON public.waiter_calls
FOR INSERT TO anon, authenticated
WITH CHECK (
  restaurant_id IS NOT NULL
  AND is_restaurant_active(restaurant_id)
  AND EXISTS (
    SELECT 1 FROM tables t
    WHERE t.id = waiter_calls.table_id
    AND t.restaurant_id = waiter_calls.restaurant_id
    AND t.is_active = true
  )
);

-- Fix waiter_calls SELECT for anon
DROP POLICY IF EXISTS "Anon can view waiter calls for active restaurants" ON public.waiter_calls;
CREATE POLICY "Anon can view waiter calls for active restaurants" ON public.waiter_calls
FOR SELECT TO anon
USING (
  is_restaurant_active(restaurant_id)
  AND EXISTS (SELECT 1 FROM tables t WHERE t.id = waiter_calls.table_id AND t.is_active = true)
  AND status = 'pending'
  AND created_at > now() - interval '24 hours'
);

-- Fix waiter_calls SELECT for authenticated customers
DROP POLICY IF EXISTS "Authenticated customers can view pending waiter calls" ON public.waiter_calls;
CREATE POLICY "Authenticated customers can view pending waiter calls" ON public.waiter_calls
FOR SELECT TO authenticated
USING (
  status = 'pending'
  AND created_at > now() - interval '24 hours'
  AND is_restaurant_active(restaurant_id)
  AND EXISTS (
    SELECT 1 FROM tables t
    WHERE t.id = waiter_calls.table_id
    AND t.restaurant_id = waiter_calls.restaurant_id
    AND t.is_active = true
  )
);

-- Fix table_sessions INSERT policy
DROP POLICY IF EXISTS "Anyone can create table sessions" ON public.table_sessions;
CREATE POLICY "Anyone can create table sessions" ON public.table_sessions
FOR INSERT TO anon, authenticated
WITH CHECK (
  restaurant_id IS NOT NULL
  AND is_restaurant_active(restaurant_id)
  AND EXISTS (
    SELECT 1 FROM tables t
    WHERE t.id = table_sessions.table_id
    AND t.restaurant_id = table_sessions.restaurant_id
    AND t.is_active = true
  )
  AND (order_id IS NULL OR EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = table_sessions.order_id
    AND o.restaurant_id = table_sessions.restaurant_id
  ))
);

-- Fix table_sessions SELECT for anon
DROP POLICY IF EXISTS "Anon can view active table sessions" ON public.table_sessions;
CREATE POLICY "Anon can view active table sessions" ON public.table_sessions
FOR SELECT TO anon
USING (
  status = ANY(ARRAY['waiting','seated','ordering','served'])
  AND is_restaurant_active(restaurant_id)
);

-- Fix analytics_events INSERT policy
DROP POLICY IF EXISTS "Anyone can create analytics events" ON public.analytics_events;
CREATE POLICY "Anyone can create analytics events" ON public.analytics_events
FOR INSERT TO anon, authenticated
WITH CHECK (
  event_type IS NOT NULL
  AND (restaurant_id IS NULL OR is_restaurant_active(restaurant_id))
);

-- Fix scan_analytics INSERT policy
DROP POLICY IF EXISTS "Anyone can insert scan analytics" ON public.scan_analytics;
CREATE POLICY "Anyone can insert scan analytics" ON public.scan_analytics
FOR INSERT TO public
WITH CHECK (
  EXISTS (SELECT 1 FROM qr_codes q WHERE q.id = scan_analytics.qr_id AND q.is_active = true)
  AND is_restaurant_active(tenant_id)
);

-- Fix order_items SELECT policy for anon path
DROP POLICY IF EXISTS "Staff and customers can view order items" ON public.order_items;
CREATE POLICY "Staff and customers can view order items" ON public.order_items
FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
    AND (
      o.restaurant_id = get_user_restaurant_id(auth.uid())
      OR has_role(auth.uid(), 'super_admin')
      OR (auth.uid() IS NULL AND is_restaurant_active(o.restaurant_id))
    )
  )
);
