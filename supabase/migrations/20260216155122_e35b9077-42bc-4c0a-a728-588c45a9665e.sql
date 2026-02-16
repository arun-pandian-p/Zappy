
-- 3d. System Logs: Explicit DENY INSERT policy
CREATE POLICY "Deny direct inserts to system logs"
  ON public.system_logs FOR INSERT
  WITH CHECK (false);

-- 3e. QR Scan Count: Harden function and revoke public execute
CREATE OR REPLACE FUNCTION public.increment_scan_count(qr_code_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM qr_codes
    WHERE id = qr_code_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  ) THEN
    RAISE EXCEPTION 'Invalid or inactive QR code';
  END IF;

  UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = qr_code_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_scan_count(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_scan_count(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_scan_count(uuid) FROM authenticated;
