-- Add missing fields to audit_logs for IP tracking and device tracking

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS device text;

-- Backwards compatibility with the auditLogger.ts
-- Update existing rows to have default 'unknown' if needed, though they can remain null
