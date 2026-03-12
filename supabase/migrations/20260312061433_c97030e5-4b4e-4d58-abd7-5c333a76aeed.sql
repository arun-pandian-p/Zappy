CREATE POLICY "Restaurant admins can manage ads"
ON public.ads
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'restaurant_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'restaurant_admin'::app_role));