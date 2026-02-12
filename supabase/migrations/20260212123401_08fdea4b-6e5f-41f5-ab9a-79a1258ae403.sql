
-- ============================================
-- Phase 1: New Tables for Super Admin Overhaul
-- ============================================

-- 1. Platform Settings (single-row config)
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name text NOT NULL DEFAULT 'QR Dine Pro',
  logo_url text,
  favicon_url text,
  primary_color text DEFAULT '#3B82F6',
  secondary_color text DEFAULT '#10B981',
  email_logo_url text,
  login_bg_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read platform settings"
  ON public.platform_settings FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update platform settings"
  ON public.platform_settings FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can insert platform settings"
  ON public.platform_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Seed default row
INSERT INTO public.platform_settings (platform_name) VALUES ('QR Dine Pro');

-- 2. Default Tax Settings (single-row defaults)
CREATE TABLE public.default_tax_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gst_percent numeric NOT NULL DEFAULT 5.00,
  service_charge_percent numeric NOT NULL DEFAULT 0.00,
  vat_percent numeric NOT NULL DEFAULT 0.00,
  tax_mode text NOT NULL DEFAULT 'exclusive',
  currency text NOT NULL DEFAULT 'INR',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.default_tax_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read default tax settings"
  ON public.default_tax_settings FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update default tax settings"
  ON public.default_tax_settings FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can insert default tax settings"
  ON public.default_tax_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Seed default row
INSERT INTO public.default_tax_settings (gst_percent, service_charge_percent, vat_percent, tax_mode, currency)
VALUES (5.00, 0.00, 0.00, 'exclusive', 'INR');

-- 3. Email Templates
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL UNIQUE,
  subject text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  variables_json jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage email templates"
  ON public.email_templates FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Seed 5 default templates
INSERT INTO public.email_templates (template_name, subject, body_html, variables_json) VALUES
('admin_credentials', 'Your Admin Login Credentials', '<h1>Welcome to {{restaurant_name}}</h1><p>Email: {{admin_email}}</p><p>Password: {{temporary_password}}</p><p><a href="{{login_url}}">Login here</a></p>', '["restaurant_name","admin_email","temporary_password","login_url"]'::jsonb),
('staff_invite', 'Staff Account Created', '<h1>Welcome to {{restaurant_name}}</h1><p>Your account has been created.</p><p>Email: {{admin_email}}</p><p>Password: {{temporary_password}}</p><p><a href="{{login_url}}">Login here</a></p>', '["restaurant_name","admin_email","temporary_password","login_url"]'::jsonb),
('subscription_invoice', 'Subscription Invoice - {{restaurant_name}}', '<h1>Invoice</h1><p>Restaurant: {{restaurant_name}}</p><p>Amount: {{amount}}</p><p>Period: {{period}}</p>', '["restaurant_name","amount","period"]'::jsonb),
('password_reset', 'Password Reset Request', '<h1>Password Reset</h1><p>Click the link below to reset your password:</p><p><a href="{{reset_url}}">Reset Password</a></p>', '["reset_url","admin_email"]'::jsonb),
('trial_expiry', 'Trial Expiring Soon - {{restaurant_name}}', '<h1>Trial Expiring</h1><p>Your trial for {{restaurant_name}} expires on {{expiry_date}}.</p><p><a href="{{upgrade_url}}">Upgrade now</a></p>', '["restaurant_name","expiry_date","upgrade_url"]'::jsonb);

-- 4. System Logs
CREATE TABLE public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view system logs"
  ON public.system_logs FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- No INSERT policy needed since edge functions use service role key

-- 5. Add new tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_logs;

-- Check if restaurants is already in the publication, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'restaurants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurants;
  END IF;
END $$;

-- Triggers for updated_at
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_default_tax_settings_updated_at
  BEFORE UPDATE ON public.default_tax_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
