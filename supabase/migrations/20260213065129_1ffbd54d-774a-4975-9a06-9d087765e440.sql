
-- Tighten scan_analytics INSERT to require valid qr_id and tenant_id
DROP POLICY "Anyone can insert scan analytics" ON public.scan_analytics;
CREATE POLICY "Anyone can insert scan analytics"
  ON public.scan_analytics FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.qr_codes q WHERE q.id = scan_analytics.qr_id AND q.is_active = true)
    AND EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = scan_analytics.tenant_id AND r.is_active = true)
  );
