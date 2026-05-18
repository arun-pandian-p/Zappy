-- Create Campaign Events Table for live promotion impression and click tracking
CREATE TABLE IF NOT EXISTS public.campaign_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  campaign_id UUID NOT NULL,
  customer_id UUID,
  session_id TEXT,
  event_type TEXT NOT NULL, -- 'impression', 'click', 'add_to_cart', 'coupon_applied', 'checkout_started', 'order_completed'
  metadata JSONB DEFAULT '{}'::jsonb,
  revenue_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Coupon Redemptions Table for authentic order revenue attribution
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  coupon_code TEXT NOT NULL,
  campaign_id UUID,
  order_id UUID NOT NULL,
  customer_id UUID,
  discount_amount NUMERIC DEFAULT 0,
  order_total NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for lightning fast aggregations and dashboard loading
CREATE INDEX IF NOT EXISTS idx_campaign_events_campaign_type ON public.campaign_events (campaign_id, event_type);
CREATE INDEX IF NOT EXISTS idx_campaign_events_tenant ON public.campaign_events (tenant_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_tenant ON public.coupon_redemptions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaign_events_created ON public.campaign_events (created_at);

-- Secure both tables with Row Level Security (RLS)
ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous customer clients to record events and redemptions
DROP POLICY IF EXISTS "Public insert campaign events" ON public.campaign_events;
CREATE POLICY "Public insert campaign events" 
ON public.campaign_events FOR INSERT 
TO public 
WITH CHECK (true);

DROP POLICY IF EXISTS "Public insert coupon redemptions" ON public.coupon_redemptions;
CREATE POLICY "Public insert coupon redemptions" 
ON public.coupon_redemptions FOR INSERT 
TO public 
WITH CHECK (true);

-- Allow authenticated dashboard owners to read live analytics metrics
DROP POLICY IF EXISTS "Admins select campaign events" ON public.campaign_events;
CREATE POLICY "Admins select campaign events" 
ON public.campaign_events FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Admins select coupon redemptions" ON public.coupon_redemptions;
CREATE POLICY "Admins select coupon redemptions" 
ON public.coupon_redemptions FOR SELECT 
TO authenticated 
USING (true);

-- Enable real-time replication for dashboard updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'campaign_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_events;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'coupon_redemptions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coupon_redemptions;
  END IF;
END $$;
