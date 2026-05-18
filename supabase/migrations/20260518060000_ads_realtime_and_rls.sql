-- Step 1: Secure RLS Policies for Advertisement Tables
-- Recreate the SELECT policy to ensure customers can securely query active, scheduled ad campaigns
DROP POLICY IF EXISTS "Public can view active ads" ON public.ads;
DROP POLICY IF EXISTS "Customers can read active promotions" ON public.ads;

CREATE POLICY "Customers can read active promotions"
ON public.ads
FOR SELECT
TO public
USING (
  is_active = true 
  AND (starts_at IS NULL OR starts_at <= now()) 
  AND (ends_at IS NULL OR ends_at >= now())
);

-- Step 2: Enable Supabase Realtime Synchronization
-- Add the 'ads' table to the 'supabase_realtime' publication to support real-time CRUD notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ads;
  END IF;
END $$;
