
-- Create a public-safe view of restaurants (excludes PII and sensitive business data)
CREATE VIEW public.restaurants_public AS
SELECT 
  id, name, slug, description, logo_url, cover_image_url,
  banner_image_url, favicon_url, menu_title, address,
  primary_color, secondary_color, currency, font_family,
  theme_config, ads_enabled, google_review_url, is_active
FROM public.restaurants
WHERE is_active = true;

-- Grant access to anon and authenticated roles
GRANT SELECT ON public.restaurants_public TO anon, authenticated;

-- Drop the overly permissive public SELECT policies on the base table
DROP POLICY IF EXISTS "Public can view active restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Authenticated users can view restaurants" ON public.restaurants;

-- Add a staff-only SELECT policy for the base table (full data access)
CREATE POLICY "Staff can view their restaurant"
ON public.restaurants FOR SELECT
TO authenticated
USING (
  id = get_user_restaurant_id(auth.uid())
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Also fix the feedback table: ensure only staff can read (already the case, but 
-- let's also restrict anon from any SELECT by adding explicit deny for clarity)
-- The existing policy "Restaurant staff can view feedback" already restricts to staff.
-- No changes needed for feedback RLS - it's already secure.
