-- Remove the overly permissive anonymous fallback from invoices RLS policy
DROP POLICY IF EXISTS "Allow invoice operations" ON public.invoices;

-- Recreate without anonymous access
CREATE POLICY "Allow invoice operations"
ON public.invoices
FOR ALL
USING (restaurant_id = get_user_restaurant_id(auth.uid()))
WITH CHECK (restaurant_id = get_user_restaurant_id(auth.uid()));