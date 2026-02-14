
-- Landing page CMS sections
CREATE TABLE public.landing_page_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_visible boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.landing_page_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage landing sections"
ON public.landing_page_sections FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Public can view visible landing sections"
ON public.landing_page_sections FOR SELECT
USING (is_visible = true);

-- Super admin profile
CREATE TABLE public.super_admin_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  phone text,
  theme_preference text DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.super_admin_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage profiles"
ON public.super_admin_profile FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Add creator_email to platform_settings for branding lock
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS creator_email text DEFAULT 'arunpandi47777@gmail.com';

-- Trigger for updated_at on new tables
CREATE TRIGGER update_landing_page_sections_updated_at
BEFORE UPDATE ON public.landing_page_sections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_super_admin_profile_updated_at
BEFORE UPDATE ON public.super_admin_profile
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default landing page sections
INSERT INTO public.landing_page_sections (section_key, content_json, display_order) VALUES
('hero', '{"title": "Smart QR-Based Restaurant Management", "subtitle": "Transform your restaurant operations with intelligent digital ordering, real-time kitchen sync, and powerful analytics.", "cta_text": "Get Started Free", "cta_link": "/admin/login", "badge_text": "🚀 Trusted by 500+ restaurants"}', 1),
('features', '{"heading": "Everything You Need", "subheading": "Powerful features to run your restaurant", "items": [{"icon": "QrCode", "title": "QR Ordering", "description": "Contactless digital menu and ordering"}, {"icon": "ChefHat", "title": "Kitchen Display", "description": "Real-time order management"}, {"icon": "BarChart3", "title": "Analytics", "description": "Revenue and performance insights"}, {"icon": "CreditCard", "title": "Smart Billing", "description": "Automated invoicing and payments"}]}', 2),
('how_it_works', '{"heading": "How It Works", "steps": [{"step": 1, "title": "Scan QR Code", "description": "Customers scan the table QR"}, {"step": 2, "title": "Browse & Order", "description": "Select items from digital menu"}, {"step": 3, "title": "Kitchen Receives", "description": "Orders appear on kitchen display"}, {"step": 4, "title": "Serve & Bill", "description": "Track, serve, and generate invoice"}]}', 3),
('pricing', '{"heading": "Simple, Transparent Pricing", "subheading": "Choose the plan that fits your restaurant"}', 4),
('testimonials', '{"heading": "Loved by Restaurant Owners", "items": [{"name": "Rajesh Kumar", "role": "Owner, Spice Garden", "quote": "Increased our order efficiency by 40%", "avatar": ""}, {"name": "Priya Sharma", "role": "Manager, The Food Court", "quote": "Best investment for our restaurant chain", "avatar": ""}]}', 5),
('cta_banner', '{"headline": "Ready to Transform Your Restaurant?", "subtitle": "Join hundreds of restaurants already using QR Dine Pro", "cta_text": "Start Free Trial", "cta_link": "/admin/login"}', 6),
('footer', '{"company_name": "QR Dine Pro", "tagline": "Smart Restaurant Management", "links": [{"label": "Features", "href": "#features"}, {"label": "Pricing", "href": "#pricing"}, {"label": "Contact", "href": "mailto:support@qrdinepro.com"}]}', 7)
ON CONFLICT (section_key) DO NOTHING;

-- Enable realtime for landing_page_sections
ALTER PUBLICATION supabase_realtime ADD TABLE public.landing_page_sections;
