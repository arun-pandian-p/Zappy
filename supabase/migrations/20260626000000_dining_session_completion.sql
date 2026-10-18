-- Migration: 20260626000000_dining_session_completion.sql
-- Provides atomic, secure session completion RPC and permissive RLS for guest End Session action

CREATE OR REPLACE FUNCTION public.complete_dining_session(
  p_session_id UUID DEFAULT NULL,
  p_table_id UUID DEFAULT NULL,
  p_restaurant_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID := NULL;
  v_restaurant_id UUID := p_restaurant_id;
  v_table_id UUID := p_table_id;
BEGIN
  -- 1. Try resolving session_id from table_sessions directly
  IF p_session_id IS NOT NULL THEN
    SELECT id, restaurant_id, table_id 
    INTO v_session_id, v_restaurant_id, v_table_id
    FROM public.table_sessions
    WHERE id = p_session_id;
    
    -- If not found in table_sessions, check if p_session_id is a seat_occupancy ID
    IF v_session_id IS NULL THEN
      SELECT s.table_session_id, s.restaurant_id, s.table_id
      INTO v_session_id, v_restaurant_id, v_table_id
      FROM public.seat_occupancy s
      WHERE s.id = p_session_id;
    END IF;
  END IF;

  -- 2. If session_id still not resolved, check active/latest session for the given table
  IF v_session_id IS NULL AND v_table_id IS NOT NULL THEN
    SELECT id, restaurant_id, table_id
    INTO v_session_id, v_restaurant_id, v_table_id
    FROM public.table_sessions
    WHERE table_id = v_table_id
      AND (p_restaurant_id IS NULL OR restaurant_id = p_restaurant_id)
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- 3. If we resolved a table_session, complete it
  IF v_session_id IS NOT NULL THEN
    UPDATE public.table_sessions
    SET status = 'completed', completed_at = now()
    WHERE id = v_session_id;

    UPDATE public.seat_occupancy
    SET status = 'available', order_id = NULL
    WHERE table_session_id = v_session_id;
  END IF;

  -- 4. If p_session_id was a seat_occupancy ID, ensure it is released
  IF p_session_id IS NOT NULL THEN
    UPDATE public.seat_occupancy
    SET status = 'available', order_id = NULL
    WHERE id = p_session_id;
  END IF;

  -- 5. Update table status and waiter calls if table is known
  IF v_table_id IS NOT NULL THEN
    UPDATE public.tables
    SET status = 'needs_cleaning'
    WHERE id = v_table_id;

    UPDATE public.waiter_calls
    SET status = 'resolved', responded_at = now()
    WHERE table_id = v_table_id AND status = 'pending';

    -- Free any remaining occupied seats at this table
    UPDATE public.seat_occupancy
    SET status = 'available', order_id = NULL
    WHERE table_id = v_table_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'session_id', v_session_id, 
    'table_id', v_table_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_dining_session(UUID, UUID, UUID) TO anon, authenticated;

-- Ensure table_sessions allows completion by anon / guests
DROP POLICY IF EXISTS "Anon can update own active table session" ON public.table_sessions;
CREATE POLICY "Anon can update own active table session"
ON public.table_sessions
FOR UPDATE
TO anon, authenticated
USING (
  is_restaurant_active(restaurant_id)
)
WITH CHECK (
  status IN ('completed', 'ordering', 'served')
);

-- Ensure seat_occupancy allows release on session end
DROP POLICY IF EXISTS "Anyone can update seat occupancy" ON public.seat_occupancy;
CREATE POLICY "Anyone can update seat occupancy"
ON public.seat_occupancy
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
