-- Migration: 20260624000000_google_places_multi_tenant.sql
-- Add multi-tenant Location & Google Places Rating & Reviews columns to restaurants table

ALTER TABLE public.restaurants 
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS google_place_id TEXT,
  ADD COLUMN IF NOT EXISTS google_place_name TEXT,
  ADD COLUMN IF NOT EXISTS google_formatted_address TEXT,
  ADD COLUMN IF NOT EXISTS google_rating NUMERIC(2, 1),
  ADD COLUMN IF NOT EXISTS google_user_ratings_total INTEGER,
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
  ADD COLUMN IF NOT EXISTS google_review_url TEXT,
  ADD COLUMN IF NOT EXISTS google_synced_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS google_sync_status TEXT DEFAULT 'not_connected',
  ADD COLUMN IF NOT EXISTS google_sync_error TEXT,
  ADD COLUMN IF NOT EXISTS google_reviews_cache JSONB;

-- Index for Place ID lookups
CREATE INDEX IF NOT EXISTS idx_restaurants_google_place_id 
  ON public.restaurants(google_place_id) 
  WHERE google_place_id IS NOT NULL;

-- Recreate restaurants_public view to include safe public location and Google ratings metadata
DROP VIEW IF EXISTS public.restaurants_public;

CREATE VIEW public.restaurants_public WITH (security_invoker = true) AS
SELECT
  id,
  name,
  slug,
  description,
  logo_url,
  cover_image_url,
  banner_image_url,
  favicon_url,
  menu_title,
  address,
  city,
  state,
  country,
  postal_code,
  latitude,
  longitude,
  primary_color,
  secondary_color,
  currency,
  font_family,
  theme_config,
  ads_enabled,
  google_place_id,
  google_place_name,
  google_formatted_address,
  google_rating,
  google_user_ratings_total,
  google_maps_url,
  google_review_url,
  google_synced_at,
  google_sync_status,
  google_reviews_cache,
  is_active
FROM public.restaurants
WHERE is_active = true;

-- Grant select permission to all web clients
GRANT SELECT ON public.restaurants_public TO anon, authenticated;
