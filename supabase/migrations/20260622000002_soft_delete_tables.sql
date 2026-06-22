-- Add deleted_at column to tables for soft delete support
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
