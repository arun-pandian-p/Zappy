-- Recreate restaurants_public view WITHOUT security_invoker
-- so anon users can read through the view (view owner = postgres which bypasses RLS)
DROP VIEW IF EXISTS public.restaurants_public;

CREATE VIEW public.restaurants_public AS
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
  primary_color,
  secondary_color,
  currency,
  font_family,
  theme_config,
  ads_enabled,
  google_review_url,
  is_active
FROM public.restaurants
WHERE is_active = true;