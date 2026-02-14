
INSERT INTO storage.buckets (id, name, public)
VALUES ('platform-assets', 'platform-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view platform assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'platform-assets');

CREATE POLICY "Authenticated users can upload platform assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'platform-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update platform assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'platform-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete platform assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'platform-assets' AND auth.role() = 'authenticated');
