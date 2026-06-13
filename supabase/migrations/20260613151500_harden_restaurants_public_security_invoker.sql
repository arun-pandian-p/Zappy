-- Recreate the restaurants_public view with security_invoker = true
-- This ensures queries to this view run with the RLS policies and permissions of the invoking user, resolving the Supabase database linter warning (0010_security_definer_view).
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

-- Grant select permission to all web clients
GRANT SELECT ON public.restaurants_public TO anon, authenticated;

-- Create an RLS select policy on the base restaurants table
-- Since the view now uses security_invoker, PostgreSQL evaluates the base table's RLS policies
-- when users select from restaurants_public. We allow anyone to read active restaurant rows.
DROP POLICY IF EXISTS "Public can view active restaurants" ON public.restaurants;
CREATE POLICY "Public can view active restaurants"
ON public.restaurants FOR SELECT
TO anon, authenticated
USING (is_active = true);
