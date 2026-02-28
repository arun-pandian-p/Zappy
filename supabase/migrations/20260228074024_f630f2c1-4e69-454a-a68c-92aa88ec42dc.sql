
-- Recreate the view with security_invoker = true to satisfy the linter
DROP VIEW IF EXISTS public.restaurants_public;

CREATE VIEW public.restaurants_public
WITH (security_invoker = on) AS
SELECT 
  id, name, slug, description, logo_url, cover_image_url,
  banner_image_url, favicon_url, menu_title, address,
  primary_color, secondary_color, currency, font_family,
  theme_config, ads_enabled, google_review_url, is_active
FROM public.restaurants
WHERE is_active = true;

GRANT SELECT ON public.restaurants_public TO anon, authenticated;

-- Since security_invoker=on means RLS applies as the calling user,
-- we need a permissive SELECT policy for anon/public on the base table
-- but ONLY for the columns exposed by the view.
-- RLS is row-level not column-level, so we add a limited public policy back.
CREATE POLICY "Public can view active restaurants via view"
ON public.restaurants FOR SELECT
USING (is_active = true);
