-- Add idempotency_key to orders table to prevent duplicate orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key UUID UNIQUE;
