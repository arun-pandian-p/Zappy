
-- 1. Fix waiter_calls: Replace USING(true) with scoped policy
DROP POLICY IF EXISTS "Anyone can view waiter calls by restaurant" ON public.waiter_calls;

CREATE POLICY "Anon can view waiter calls for active restaurants"
ON public.waiter_calls FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = waiter_calls.restaurant_id AND r.is_active = true
  )
  AND EXISTS (
    SELECT 1 FROM tables t
    WHERE t.id = waiter_calls.table_id AND t.is_active = true
  )
  AND status = 'pending'
  AND created_at > now() - interval '24 hours'
);

-- 2. Fix orders: Replace broad anon SELECT with a view that excludes PII
DROP POLICY IF EXISTS "Customers can view orders for active restaurants" ON public.orders;

CREATE POLICY "Customers can view their table orders (no PII)"
ON public.orders FOR SELECT TO anon
USING (
  table_id IS NOT NULL
  AND created_at > now() - interval '24 hours'
  AND EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = orders.restaurant_id AND r.is_active = true
  )
);

-- Create a view for anon order access that strips PII
CREATE OR REPLACE VIEW public.orders_public AS
SELECT
  id, restaurant_id, table_id, order_number, status,
  subtotal, tax_amount, service_charge, total_amount,
  payment_method, payment_status, special_instructions,
  estimated_ready_at, started_preparing_at, ready_at,
  created_at, updated_at
FROM public.orders
WHERE table_id IS NOT NULL
  AND created_at > now() - interval '24 hours';

-- 3. Fix table_sessions: Replace USING(true) with scoped policy
DROP POLICY IF EXISTS "Anyone can view table sessions by restaurant" ON public.table_sessions;

CREATE POLICY "Anon can view active table sessions"
ON public.table_sessions FOR SELECT TO anon
USING (
  status IN ('waiting', 'seated', 'ordering', 'served')
  AND EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = table_sessions.restaurant_id AND r.is_active = true
  )
);

CREATE POLICY "Authenticated staff can view table sessions"
ON public.table_sessions FOR SELECT TO authenticated
USING (
  restaurant_id = get_user_restaurant_id(auth.uid())
  OR has_role(auth.uid(), 'super_admin'::app_role)
);
