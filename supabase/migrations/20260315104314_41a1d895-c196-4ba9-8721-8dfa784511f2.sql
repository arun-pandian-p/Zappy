
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS campaign_type text DEFAULT 'platform_promotion',
  ADD COLUMN IF NOT EXISTS placement_type text DEFAULT 'popup_offer',
  ADD COLUMN IF NOT EXISTS cta_text text,
  ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advertiser_name text,
  ADD COLUMN IF NOT EXISTS target_restaurants uuid[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS budget numeric,
  ADD COLUMN IF NOT EXISTS revenue_model text DEFAULT 'cpm';
