-- Migration: Create customer_profiles table for anonymous diner profile persistence
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for speedy device lookup
CREATE INDEX IF NOT EXISTS idx_customer_profiles_device_id ON public.customer_profiles (device_id);

-- Enable Row Level Security
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

-- Grant permissions to public roles
GRANT ALL ON TABLE public.customer_profiles TO anon, authenticated, service_role;

-- RLS Policies allowing diner devices to read, create, and update their profiles
DROP POLICY IF EXISTS "Allow public read access to customer_profiles" ON public.customer_profiles;
CREATE POLICY "Allow public read access to customer_profiles"
  ON public.customer_profiles
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow public insert to customer_profiles" ON public.customer_profiles;
CREATE POLICY "Allow public insert to customer_profiles"
  ON public.customer_profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to customer_profiles" ON public.customer_profiles;
CREATE POLICY "Allow public update to customer_profiles"
  ON public.customer_profiles
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);
