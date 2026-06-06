-- ============================================================
-- FIX: Customer Review Submission (Anon RLS Policies)
-- 
-- Root Cause: Customers use the app WITHOUT being logged in
-- (anon role). INSERT policies were missing or not targeting
-- the 'anon' role explicitly, blocking all customer reviews.
-- ============================================================

-- ─── feedback table ─────────────────────────────────────────

-- Allow any anonymous customer to submit feedback
DROP POLICY IF EXISTS "anon_can_insert_feedback" ON feedback;
CREATE POLICY "anon_can_insert_feedback"
  ON feedback FOR INSERT
  TO anon
  WITH CHECK (true);

-- Also allow authenticated users (staff testing)
DROP POLICY IF EXISTS "authenticated_can_insert_feedback" ON feedback;
CREATE POLICY "authenticated_can_insert_feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ─── enterprise_reviews table ────────────────────────────────

-- Drop old generic policy (if it exists without role specification)
DROP POLICY IF EXISTS "Public can insert reviews" ON enterprise_reviews;

-- Re-create with explicit anon targeting
DROP POLICY IF EXISTS "anon_can_insert_enterprise_reviews" ON enterprise_reviews;
CREATE POLICY "anon_can_insert_enterprise_reviews"
  ON enterprise_reviews FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_can_insert_enterprise_reviews" ON enterprise_reviews;
CREATE POLICY "authenticated_can_insert_enterprise_reviews"
  ON enterprise_reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ─── review_ai_insights table ────────────────────────────────
-- (No INSERT policy existed — blocked all writes)

DROP POLICY IF EXISTS "anon_can_insert_review_ai_insights" ON review_ai_insights;
CREATE POLICY "anon_can_insert_review_ai_insights"
  ON review_ai_insights FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_can_insert_review_ai_insights" ON review_ai_insights;
CREATE POLICY "authenticated_can_insert_review_ai_insights"
  ON review_ai_insights FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ─── review_recoveries table ─────────────────────────────────
-- (No INSERT policy existed — blocked all writes)

DROP POLICY IF EXISTS "anon_can_insert_review_recoveries" ON review_recoveries;
CREATE POLICY "anon_can_insert_review_recoveries"
  ON review_recoveries FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_can_insert_review_recoveries" ON review_recoveries;
CREATE POLICY "authenticated_can_insert_review_recoveries"
  ON review_recoveries FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ─── feedback SELECT: restaurant admin can see their own ─────
DROP POLICY IF EXISTS "admins_can_view_feedback" ON feedback;
CREATE POLICY "admins_can_view_feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

-- Super admin can view all feedback
DROP POLICY IF EXISTS "super_admin_can_view_all_feedback" ON feedback;
CREATE POLICY "super_admin_can_view_all_feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );
