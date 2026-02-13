
-- QR Codes table
CREATE TABLE public.qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  qr_name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  qr_type TEXT NOT NULL DEFAULT 'static' CHECK (qr_type IN ('static', 'dynamic')),
  scan_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant staff can manage their QR codes"
  ON public.qr_codes FOR ALL
  USING (tenant_id = get_user_restaurant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_restaurant_id(auth.uid()));

CREATE POLICY "Public can view active QR codes"
  ON public.qr_codes FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE TRIGGER update_qr_codes_updated_at
  BEFORE UPDATE ON public.qr_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Scan Analytics table
CREATE TABLE public.scan_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_id UUID NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  device TEXT,
  country TEXT,
  city TEXT,
  user_agent TEXT,
  referrer TEXT
);

ALTER TABLE public.scan_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert scan analytics"
  ON public.scan_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Restaurant staff can view their scan analytics"
  ON public.scan_analytics FOR SELECT
  USING (tenant_id = get_user_restaurant_id(auth.uid()));

-- Pages table
CREATE TABLE public.pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  page_slug TEXT NOT NULL,
  page_type TEXT NOT NULL DEFAULT 'menu' CHECK (page_type IN ('menu', 'landing', 'custom')),
  content_json JSONB DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant staff can manage their pages"
  ON public.pages FOR ALL
  USING (tenant_id = get_user_restaurant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_restaurant_id(auth.uid()));

CREATE POLICY "Public can view published pages"
  ON public.pages FOR SELECT
  USING (is_published = true AND EXISTS (
    SELECT 1 FROM restaurants r WHERE r.id = pages.tenant_id AND r.is_active = true
  ));

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.qr_codes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scan_analytics;
