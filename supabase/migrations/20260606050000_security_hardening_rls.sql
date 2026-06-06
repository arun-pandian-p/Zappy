-- =========================================================================
-- Sprint 4: Security Hardening RLS Policies
-- =========================================================================

-- 1. Hardening enterprise_reviews RLS INSERT policies
DROP POLICY IF EXISTS "anon_can_insert_enterprise_reviews" ON public.enterprise_reviews;
CREATE POLICY "anon_can_insert_enterprise_reviews"
  ON public.enterprise_reviews FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND o.restaurant_id = restaurant_id
    )
  );

DROP POLICY IF EXISTS "authenticated_can_insert_enterprise_reviews" ON public.enterprise_reviews;
CREATE POLICY "authenticated_can_insert_enterprise_reviews"
  ON public.enterprise_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND o.restaurant_id = restaurant_id
    )
  );

-- 2. Hardening review_ai_insights RLS INSERT policies
DROP POLICY IF EXISTS "anon_can_insert_review_ai_insights" ON public.review_ai_insights;
CREATE POLICY "anon_can_insert_review_ai_insights"
  ON public.review_ai_insights FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enterprise_reviews r
      WHERE r.id = review_id
        AND r.restaurant_id = restaurant_id
    )
  );

DROP POLICY IF EXISTS "authenticated_can_insert_review_ai_insights" ON public.review_ai_insights;
CREATE POLICY "authenticated_can_insert_review_ai_insights"
  ON public.review_ai_insights FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enterprise_reviews r
      WHERE r.id = review_id
        AND r.restaurant_id = restaurant_id
    )
  );

-- 3. Hardening review_recoveries RLS INSERT policies
DROP POLICY IF EXISTS "anon_can_insert_review_recoveries" ON public.review_recoveries;
CREATE POLICY "anon_can_insert_review_recoveries"
  ON public.review_recoveries FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enterprise_reviews r
      WHERE r.id = review_id
        AND r.restaurant_id = restaurant_id
    )
  );

DROP POLICY IF EXISTS "authenticated_can_insert_review_recoveries" ON public.review_recoveries;
CREATE POLICY "authenticated_can_insert_review_recoveries"
  ON public.review_recoveries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enterprise_reviews r
      WHERE r.id = review_id
        AND r.restaurant_id = restaurant_id
    )
  );

-- 4. Hardening orders RLS INSERT policy (requires active table session if table_id is set)
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
    OR (
      EXISTS (
        SELECT 1
        FROM public.tables t
        WHERE t.id = orders.table_id
          AND t.restaurant_id = orders.restaurant_id
          AND t.is_active = true
      )
      AND EXISTS (
        SELECT 1
        FROM public.table_sessions s
        WHERE s.table_id = orders.table_id
          AND s.restaurant_id = orders.restaurant_id
          AND s.status != 'completed'
      )
    )
  )
);
