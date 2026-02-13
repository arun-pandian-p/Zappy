
CREATE OR REPLACE FUNCTION public.increment_scan_count(qr_code_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = qr_code_id;
$$;
