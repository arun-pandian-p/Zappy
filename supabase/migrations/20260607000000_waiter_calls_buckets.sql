-- Create storage buckets for waiter call voice notes and disputes
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('waiter_calls_audio', 'waiter_calls_audio', true),
  ('order_disputes', 'order_disputes', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read for waiter_calls_audio" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload waiter_calls_audio" ON storage.objects;
DROP POLICY IF EXISTS "Public read for order_disputes" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload order_disputes" ON storage.objects;

-- Policies for waiter_calls_audio
CREATE POLICY "Public read for waiter_calls_audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'waiter_calls_audio');

CREATE POLICY "Anyone can upload waiter_calls_audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'waiter_calls_audio');

-- Policies for order_disputes
CREATE POLICY "Public read for order_disputes"
ON storage.objects FOR SELECT
USING (bucket_id = 'order_disputes');

CREATE POLICY "Anyone can upload order_disputes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'order_disputes');
