
-- The restaurants_public view intentionally uses SECURITY DEFINER (default) behavior
-- because anonymous users need to read public restaurant data for menus/feedback,
-- but the base table is now restricted to staff only.
-- The view only exposes safe, non-PII columns so this is secure by design.
-- We add an explicit comment for documentation.
COMMENT ON VIEW public.restaurants_public IS 'Public-safe view of restaurants. Intentionally uses security definer to allow anonymous access to non-sensitive columns only. Sensitive fields (email, phone, tax_rate, subscription_tier, settings, printer_settings) are excluded.';
