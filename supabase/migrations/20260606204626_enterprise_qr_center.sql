-- Enterprise QR Management Center Database Updates

-- 1. Create QR Campaigns Table
CREATE TABLE IF NOT EXISTS public.qr_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create QR Templates Table
CREATE TABLE IF NOT EXISTS public.qr_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE, -- NULL for global templates
  name TEXT NOT NULL,
  style_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  preview_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Update existing qr_codes table
ALTER TABLE public.qr_codes
ADD COLUMN IF NOT EXISTS short_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.qr_campaigns(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS scans_count INTEGER DEFAULT 0;

-- 4. Create trigger to auto-generate short_code if null
CREATE OR REPLACE FUNCTION generate_short_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.short_code IS NULL THEN
    -- Generate a 6-character random alphanumeric string
    NEW.short_code := substr(md5(random()::text), 1, 6);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_short_code ON public.qr_codes;
CREATE TRIGGER ensure_short_code
BEFORE INSERT ON public.qr_codes
FOR EACH ROW EXECUTE FUNCTION generate_short_code();

-- Generate short_codes for existing qr_codes that are missing it
UPDATE public.qr_codes SET short_code = substr(md5(random()::text), 1, 6) WHERE short_code IS NULL;

-- 5. Update scan_analytics table for better device tracking and revenue attribution
ALTER TABLE public.scan_analytics
ADD COLUMN IF NOT EXISTS os TEXT,
ADD COLUMN IF NOT EXISTS browser TEXT,
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS revenue_generated NUMERIC(10, 2) DEFAULT 0.00;

-- Enable Row Level Security (RLS)
ALTER TABLE public.qr_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for qr_campaigns
CREATE POLICY "Users can view their own tenant campaigns"
ON public.qr_campaigns FOR SELECT
USING (tenant_id IN (
    SELECT get_user_tenants(auth.uid())
));

CREATE POLICY "Users can insert their own tenant campaigns"
ON public.qr_campaigns FOR INSERT
WITH CHECK (tenant_id IN (
    SELECT get_user_tenants(auth.uid())
));

CREATE POLICY "Users can update their own tenant campaigns"
ON public.qr_campaigns FOR UPDATE
USING (tenant_id IN (
    SELECT get_user_tenants(auth.uid())
));

CREATE POLICY "Users can delete their own tenant campaigns"
ON public.qr_campaigns FOR DELETE
USING (tenant_id IN (
    SELECT get_user_tenants(auth.uid())
));

-- RLS Policies for qr_templates
CREATE POLICY "Users can view global templates and their own"
ON public.qr_templates FOR SELECT
USING (tenant_id IS NULL OR tenant_id IN (
    SELECT get_user_tenants(auth.uid())
));

CREATE POLICY "Users can insert their own tenant templates"
ON public.qr_templates FOR INSERT
WITH CHECK (tenant_id IN (
    SELECT get_user_tenants(auth.uid())
));

CREATE POLICY "Users can update their own tenant templates"
ON public.qr_templates FOR UPDATE
USING (tenant_id IN (
    SELECT get_user_tenants(auth.uid())
));

CREATE POLICY "Users can delete their own tenant templates"
ON public.qr_templates FOR DELETE
USING (tenant_id IN (
    SELECT get_user_tenants(auth.uid())
));

-- Add realtime publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.qr_campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.qr_templates;
