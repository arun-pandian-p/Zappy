-- ============================================================
-- ZAPPY - COMPLETE MASTER MIGRATION SQL
-- Target: Fresh Supabase Project
-- Generated from: github.com/shadow-byte-warrior/Zappy
-- Phase Coverage: Schema + RLS + Storage + Seed + Auth
-- ============================================================
-- EXECUTION ORDER:
--   1. Run this file FIRST in your new Supabase SQL Editor
--   2. Run 01_STORAGE_UPLOAD.md for image upload instructions
--   3. Run 02_SEED_ADMIN_USER.sql to create super_admin
--   4. Run 03_SEED_FOOD_DATA.sql for restaurant + menu data
-- ============================================================

-- ============================================================
-- SECTION 1: ENUMS
-- ============================================================

CREATE TYPE public.app_role AS ENUM (
  'super_admin', 'restaurant_admin', 'kitchen_staff',
  'waiter_staff', 'billing_staff', 'manager'
);

CREATE TYPE public.order_status AS ENUM (
  'pending', 'confirmed', 'preparing', 'ready',
  'served', 'completed', 'cancelled'
);

CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro', 'enterprise');

CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'refunded');

CREATE TYPE promotion_type AS ENUM (
  'percentage', 'flat_discount', 'bogo', 'free_delivery', 'combo'
);

CREATE TYPE promotion_status AS ENUM (
  'draft', 'pending_approval', 'active', 'rejected', 'paused', 'expired'
);

CREATE TYPE promotion_origin AS ENUM ('restaurant', 'superadmin', 'sponsored');

CREATE TYPE review_sentiment AS ENUM ('positive', 'neutral', 'negative', 'angry');
CREATE TYPE review_status AS ENUM ('published', 'pending_moderation', 'resolved', 'escalated');
CREATE TYPE review_source AS ENUM ('in_app', 'qr', 'sms', 'whatsapp', 'email');


-- ============================================================
-- SECTION 2: CORE TABLES
-- ============================================================

-- 2.1 Restaurants (multi-tenant anchor)
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  banner_image_url TEXT,
  favicon_url TEXT,
  menu_title TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  google_review_url TEXT,
  tax_rate DECIMAL(5,2) DEFAULT 5.00,
  service_charge_rate DECIMAL(5,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'INR',
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#10B981',
  font_family TEXT DEFAULT 'Inter',
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  ads_enabled BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  printer_settings JSONB DEFAULT '{"type":"none","address":null,"auto_print_kitchen":false,"auto_print_billing":true}',
  review_settings JSONB DEFAULT '{"enabled":true,"google_redirect_threshold":4,"google_review_url":null}',
  theme_config JSONB DEFAULT '{"preset":"classic","custom_primary":null,"custom_secondary":null,"custom_font":null,"button_style":"rounded"}',
  feature_toggles JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.2 User Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, restaurant_id, role)
);

-- 2.3 Staff Profiles
CREATE TABLE public.staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT staff_profiles_user_id_key UNIQUE (user_id),
  CONSTRAINT staff_profiles_restaurant_email_key UNIQUE (restaurant_id, email)
);

CREATE INDEX IF NOT EXISTS staff_profiles_restaurant_id_idx ON public.staff_profiles (restaurant_id);
CREATE INDEX IF NOT EXISTS staff_profiles_email_idx ON public.staff_profiles (email);

-- 2.4 Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, restaurant_id)
);

-- 2.5 Menu Items
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_vegetarian BOOLEAN DEFAULT false,
  is_vegan BOOLEAN DEFAULT false,
  spicy_level INT DEFAULT 0 CHECK (spicy_level >= 0 AND spicy_level <= 5),
  is_popular BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  prep_time_minutes INT DEFAULT 15,
  display_order INT DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  addon_group_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.6 Tables (physical restaurant tables)
CREATE TABLE public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  table_number TEXT NOT NULL,
  capacity INT DEFAULT 4,
  status TEXT DEFAULT 'available',
  qr_code_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, table_number)
);

-- 2.7 Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  order_number SERIAL,
  customer_name TEXT,
  customer_phone TEXT,
  status order_status DEFAULT 'pending',
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  service_charge DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  payment_status payment_status DEFAULT 'pending',
  payment_method TEXT,
  special_instructions TEXT,
  estimated_ready_at TIMESTAMPTZ,
  started_preparing_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  cancel_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.8 Order Items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  special_instructions TEXT,
  status order_status DEFAULT 'pending',
  selected_variants JSONB DEFAULT '[]',
  selected_addons JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.9 Waiter Calls
CREATE TABLE public.waiter_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  responded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.10 Feedback
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  customer_name TEXT,
  customer_email TEXT,
  redirected_to_google BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.11 Subscription Plans
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tier subscription_tier UNIQUE NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  max_tables INT DEFAULT 1,
  max_orders_per_month INT DEFAULT 50,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.12 Ads
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  target_locations TEXT[],
  target_categories TEXT[],
  target_restaurants UUID[] DEFAULT NULL,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  campaign_type TEXT DEFAULT 'platform_promotion',
  placement_type TEXT DEFAULT 'popup_offer',
  cta_text TEXT,
  priority INTEGER DEFAULT 0,
  advertiser_name TEXT,
  budget NUMERIC,
  revenue_model TEXT DEFAULT 'cpm',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.13 Analytics Events
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.14 Analytics Daily
CREATE TABLE public.analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_revenue NUMERIC DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  avg_order_value NUMERIC DEFAULT 0,
  avg_prep_time_minutes INTEGER DEFAULT 0,
  avg_wait_time_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, date)
);

-- 2.15 Customer Events
CREATE TABLE public.customer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  session_id TEXT,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.16 Coupons
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  max_discount_amount NUMERIC,
  min_order_amount NUMERIC DEFAULT 0,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, code)
);

-- 2.17 Table Sessions
CREATE TABLE public.table_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'seated', 'ordering', 'served', 'billing', 'completed')),
  seated_at TIMESTAMPTZ,
  order_placed_at TIMESTAMPTZ,
  food_ready_at TIMESTAMPTZ,
  served_at TIMESTAMPTZ,
  billing_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.18 Printer Queue
CREATE TABLE public.printer_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  receipt_type TEXT NOT NULL DEFAULT 'kitchen',
  receipt_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.19 Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  service_charge NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'paid',
  items JSONB NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  notes TEXT,
  printed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_invoices_number ON public.invoices(restaurant_id, invoice_number);

-- 2.20 Invoice Sync Log
CREATE TABLE public.invoice_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id),
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  response JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.21 Offers
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  discount_text TEXT,
  linked_menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.22 QR Codes
CREATE TABLE public.qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  qr_name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  qr_type TEXT NOT NULL DEFAULT 'static' CHECK (qr_type IN ('static', 'dynamic')),
  scan_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.23 Scan Analytics
CREATE TABLE public.scan_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_id UUID NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  device TEXT,
  country TEXT,
  city TEXT,
  user_agent TEXT,
  referrer TEXT
);

-- 2.24 Pages
CREATE TABLE public.pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  page_slug TEXT NOT NULL,
  page_type TEXT NOT NULL DEFAULT 'menu' CHECK (page_type IN ('menu', 'landing', 'custom')),
  content_json JSONB DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.25 Variant Groups
CREATE TABLE public.variant_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  min_select INTEGER NOT NULL DEFAULT 1,
  max_select INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.26 Variant Options
CREATE TABLE public.variant_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_group_id UUID NOT NULL REFERENCES public.variant_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_modifier NUMERIC NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.27 Addon Groups
CREATE TABLE public.addon_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_select INTEGER NOT NULL DEFAULT 0,
  max_select INTEGER NOT NULL DEFAULT 5,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.28 Addon Options
CREATE TABLE public.addon_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  addon_group_id UUID NOT NULL REFERENCES public.addon_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.29 Inventory Items
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  current_stock NUMERIC NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.30 Recipe Mappings
CREATE TABLE public.recipe_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity_used NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.31 Platform Settings (Super Admin)
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name TEXT NOT NULL DEFAULT 'QR Dine Pro',
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#10B981',
  email_logo_url TEXT,
  login_bg_url TEXT,
  creator_email TEXT DEFAULT 'arunpandi47777@gmail.com',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.32 Default Tax Settings
CREATE TABLE public.default_tax_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gst_percent NUMERIC NOT NULL DEFAULT 5.00,
  service_charge_percent NUMERIC NOT NULL DEFAULT 0.00,
  vat_percent NUMERIC NOT NULL DEFAULT 0.00,
  tax_mode TEXT NOT NULL DEFAULT 'exclusive',
  currency TEXT NOT NULL DEFAULT 'INR',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.33 Email Templates
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  variables_json JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.34 System Logs
CREATE TABLE public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.35 Landing Page Sections
CREATE TABLE public.landing_page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  content_json JSONB NOT NULL DEFAULT '{}',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.36 Super Admin Profile
CREATE TABLE public.super_admin_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  theme_preference TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.37 Enterprise Promotions
CREATE TABLE IF NOT EXISTS public.enterprise_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  banner_url TEXT,
  promo_code TEXT UNIQUE,
  origin promotion_origin DEFAULT 'restaurant',
  status promotion_status DEFAULT 'pending_approval',
  priority INT DEFAULT 10,
  type promotion_type NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_discount DECIMAL(10,2),
  min_order_value DECIMAL(10,2) DEFAULT 0,
  target_menu_item_ids UUID[],
  target_category_ids UUID[],
  new_users_only BOOLEAN DEFAULT false,
  valid_days INT[],
  valid_hours_start TIME,
  valid_hours_end TIME,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  usage_count INT DEFAULT 0,
  max_usage INT,
  max_usage_per_user INT DEFAULT 1,
  rejection_reason TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2.38 Promotion Analytics
CREATE TABLE IF NOT EXISTS public.promotion_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES public.enterprise_promotions(id) ON DELETE CASCADE,
  order_id UUID NOT NULL,
  discount_applied DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2.39 Enterprise Reviews
CREATE TABLE IF NOT EXISTS public.enterprise_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  table_id UUID REFERENCES public.tables(id),
  customer_id UUID,
  overall_rating INT NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  food_rating INT,
  service_rating INT,
  ambiance_rating INT,
  cleanliness_rating INT,
  delivery_rating INT,
  comment TEXT,
  source review_source DEFAULT 'in_app',
  status review_status DEFAULT 'published',
  redirected_to_google BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2.40 Review AI Insights
CREATE TABLE IF NOT EXISTS public.review_ai_insights (
  review_id UUID PRIMARY KEY REFERENCES public.enterprise_reviews(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  sentiment review_sentiment NOT NULL,
  sentiment_score DECIMAL(3,2),
  is_complaint BOOLEAN DEFAULT false,
  complaint_categories TEXT[],
  positive_highlights TEXT[],
  suggested_reply TEXT,
  requires_manager_attention BOOLEAN DEFAULT false,
  fraud_score DECIMAL(3,2) DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2.41 Review Recoveries
CREATE TABLE IF NOT EXISTS public.review_recoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.enterprise_reviews(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  manager_notes TEXT,
  action_type TEXT,
  coupon_code TEXT,
  discount_value DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  resolved_at TIMESTAMPTZ
);

-- 2.42 Customer Satisfaction Scores
CREATE TABLE IF NOT EXISTS public.customer_satisfaction_scores (
  restaurant_id UUID PRIMARY KEY REFERENCES public.restaurants(id) ON DELETE CASCADE,
  date_calculated DATE NOT NULL,
  average_rating DECIMAL(3,2),
  total_reviews INT,
  nps_score INT,
  positive_sentiment_pct DECIMAL(5,2),
  negative_sentiment_pct DECIMAL(5,2),
  top_complaints TEXT[],
  top_praises TEXT[],
  recovery_success_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  UNIQUE(restaurant_id, date_calculated)
);

-- 2.43 Campaign Events
CREATE TABLE IF NOT EXISTS public.campaign_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  campaign_id UUID NOT NULL,
  customer_id UUID,
  session_id TEXT,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  revenue_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.44 Coupon Redemptions
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  coupon_code TEXT NOT NULL,
  campaign_id UUID,
  order_id UUID NOT NULL,
  customer_id UUID,
  discount_amount NUMERIC DEFAULT 0,
  order_total NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.45 Quote Requests
CREATE TABLE public.quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  restaurant_name TEXT,
  city TEXT,
  num_tables INTEGER,
  current_system TEXT,
  features_needed TEXT[],
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.46 Newsletter Subscribers
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);


-- ============================================================
-- SECTION 3: INDEXES
-- ============================================================

CREATE INDEX idx_variant_groups_menu_item ON public.variant_groups(menu_item_id);
CREATE INDEX idx_variant_options_group ON public.variant_options(variant_group_id);
CREATE INDEX idx_addon_groups_restaurant ON public.addon_groups(restaurant_id);
CREATE INDEX idx_addon_options_group ON public.addon_options(addon_group_id);
CREATE INDEX idx_inventory_restaurant ON public.inventory_items(restaurant_id);
CREATE INDEX idx_recipe_menu_item ON public.recipe_mappings(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_campaign_events_campaign_type ON public.campaign_events(campaign_id, event_type);
CREATE INDEX IF NOT EXISTS idx_campaign_events_tenant ON public.campaign_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_tenant ON public.coupon_redemptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaign_events_created ON public.campaign_events(created_at);


-- ============================================================
-- SECTION 4: HELPER FUNCTIONS
-- ============================================================

-- 4.1 Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 4.2 Role checker (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4.3 Get user's restaurant
CREATE OR REPLACE FUNCTION public.get_user_restaurant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT restaurant_id FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- 4.4 Restaurant active check (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_restaurant_active(_restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurants WHERE id = _restaurant_id AND is_active = true
  )
$$;

-- 4.5 Increment QR scan count (hardened)
CREATE OR REPLACE FUNCTION public.increment_scan_count(qr_code_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM qr_codes
    WHERE id = qr_code_id AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  ) THEN
    RAISE EXCEPTION 'Invalid or inactive QR code';
  END IF;
  UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = qr_code_id;
END;
$$;

-- Restrict public execute on sensitive functions
REVOKE EXECUTE ON FUNCTION public.increment_scan_count(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_scan_count(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_scan_count(uuid) FROM authenticated;


-- ============================================================
-- SECTION 5: TRIGGERS
-- ============================================================

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON public.tables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_printer_queue_updated_at BEFORE UPDATE ON public.printer_queue FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON public.qr_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_staff_profiles_updated_at BEFORE UPDATE ON public.staff_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_default_tax_settings_updated_at BEFORE UPDATE ON public.default_tax_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_landing_page_sections_updated_at BEFORE UPDATE ON public.landing_page_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_super_admin_profile_updated_at BEFORE UPDATE ON public.super_admin_profile FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_analytics_daily_updated_at BEFORE UPDATE ON public.analytics_daily FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_variant_groups_updated_at BEFORE UPDATE ON public.variant_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_addon_groups_updated_at BEFORE UPDATE ON public.addon_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- SECTION 6: VIEWS
-- ============================================================

-- Public-safe restaurants view (no PII)
CREATE VIEW public.restaurants_public AS
SELECT
  id, name, slug, description, logo_url, cover_image_url,
  banner_image_url, favicon_url, menu_title, address,
  primary_color, secondary_color, currency, font_family,
  theme_config, ads_enabled, google_review_url, is_active
FROM public.restaurants
WHERE is_active = true;

GRANT SELECT ON public.restaurants_public TO anon, authenticated;
COMMENT ON VIEW public.restaurants_public IS 'Public-safe view of restaurants. Excludes email, phone, tax_rate, subscription_tier, settings, printer_settings.';

-- Orders public view (no PII for anon)
CREATE OR REPLACE VIEW public.orders_public AS
SELECT
  id, restaurant_id, table_id, order_number, status,
  subtotal, tax_amount, service_charge, total_amount,
  payment_method, payment_status, special_instructions,
  estimated_ready_at, started_preparing_at, ready_at,
  created_at, updated_at
FROM public.orders
WHERE table_id IS NOT NULL
  AND created_at > now() - interval '24 hours';

GRANT SELECT ON public.orders_public TO anon, authenticated;


-- ============================================================
-- SECTION 7: ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiter_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printer_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addon_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addon_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.default_tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admin_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_recoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- SECTION 8: RLS POLICIES
-- ============================================================

-- RESTAURANTS
CREATE POLICY "Staff can view their restaurant" ON public.restaurants FOR SELECT TO authenticated
  USING (id = get_user_restaurant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Public can view active restaurants via view" ON public.restaurants FOR SELECT
  USING (is_active = true);
CREATE POLICY "Super admins can manage all restaurants" ON public.restaurants FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Restaurant admins can update their restaurant" ON public.restaurants FOR UPDATE TO authenticated
  USING (id = get_user_restaurant_id(auth.uid()));

-- USER ROLES
CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Super admins can view all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Restaurant admins can view their restaurant roles" ON public.user_roles FOR SELECT TO authenticated
  USING (restaurant_id = get_user_restaurant_id(auth.uid()));
CREATE POLICY "Restaurant admins can insert staff roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (
    (has_role(auth.uid(), 'restaurant_admin') OR has_role(auth.uid(), 'super_admin'))
    AND role NOT IN ('super_admin', 'restaurant_admin')
    AND restaurant_id = get_user_restaurant_id(auth.uid())
  );
CREATE POLICY "Restaurant admins can update staff roles" ON public.user_roles FOR UPDATE TO authenticated
  USING (
    (has_role(auth.uid(), 'restaurant_admin') OR has_role(auth.uid(), 'super_admin'))
    AND role NOT IN ('super_admin', 'restaurant_admin')
    AND restaurant_id = get_user_restaurant_id(auth.uid())
  );
CREATE POLICY "Restaurant admins can delete staff roles" ON public.user_roles FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(), 'restaurant_admin') OR has_role(auth.uid(), 'super_admin'))
    AND role NOT IN ('super_admin', 'restaurant_admin')
    AND restaurant_id = get_user_restaurant_id(auth.uid())
  );
CREATE POLICY "Super admins can manage all roles" ON public.user_roles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));

-- STAFF PROFILES
CREATE POLICY "Staff can view own profile" ON public.staff_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Restaurant admins can manage their staff" ON public.staff_profiles FOR ALL TO authenticated
  USING (
    (has_role(auth.uid(), 'restaurant_admin') AND restaurant_id = get_user_restaurant_id(auth.uid()))
    OR has_role(auth.uid(), 'super_admin')
  );

-- CATEGORIES
CREATE POLICY "Public can view active categories" ON public.categories FOR SELECT
  USING (is_active = true);
CREATE POLICY "Restaurant staff can create categories" ON public.categories FOR INSERT TO authenticated
  WITH CHECK (restaurant_id = get_user_restaurant_id(auth.uid()));
CREATE POLICY "Restaurant staff can update categories" ON public.categories FOR UPDATE TO authenticated
  USING (restaurant_id = get_user_restaurant_id(auth.uid()));
CREATE POLICY "Restaurant staff can delete categories" ON public.categories FOR DELETE TO authenticated
  USING (restaurant_id = get_user_restaurant_id(auth.uid()));

-- MENU ITEMS
CREATE POLICY "Public can view available menu items" ON public.menu_items FOR SELECT
  USING (is_available = true);
CREATE POLICY "Restaurant staff can create menu items" ON public.menu_items FOR INSERT TO authenticated
  WITH CHECK (restaurant_id = get_user_restaurant_id(auth.uid()));
CREATE POLICY "Restaurant staff can update menu items" ON public.menu_items FOR UPDATE TO authenticated
  USING (restaurant_id = get_user_restaurant_id(auth.uid()));
CREATE POLICY "Restaurant staff can delete menu items" ON public.menu_items FOR DELETE TO authenticated
  USING (restaurant_id = get_user_restaurant_id(auth.uid()));

-- TABLES
CREATE POLICY "Public can view active tables" ON public.tables FOR SELECT
  USING (is_active = true);
CREATE POLICY "Restaurant staff can manage tables" ON public.tables FOR ALL TO authenticated
  USING (restaurant_id = get_user_restaurant_id(auth.uid()));

-- ORDERS
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT TO anon, authenticated
  WITH CHECK (
    restaurant_id IS NOT NULL
    AND is_restaurant_active(restaurant_id)
    AND (table_id IS NULL OR EXISTS (
      SELECT 1 FROM public.tables t
      WHERE t.id = orders.table_id AND t.restaurant_id = orders.restaurant_id AND t.is_active = true
    ))
  );
CREATE POLICY "Restaurant staff can view orders" ON public.orders FOR SELECT TO authenticated
  USING (restaurant_id = get_user_restaurant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Customers can view their table orders (no PII)" ON public.orders FOR SELECT TO anon
  USING (table_id IS NOT NULL AND created_at > now() - interval '24 hours' AND is_restaurant_active(restaurant_id));
CREATE POLICY "Authenticated customers can view recent table orders" ON public.orders FOR SELECT TO authenticated
  USING (table_id IS NOT NULL AND created_at > now() - interval '24 hours' AND is_restaurant_active(restaurant_id));
CREATE POLICY "Restaurant staff can manage orders" ON public.orders FOR UPDATE TO authenticated
  USING (restaurant_id = get_user_restaurant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));

-- ORDER ITEMS
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT TO anon, authenticated
  WITH CHECK (order_id IS NOT NULL AND quantity > 0);
CREATE POLICY "Staff and customers can view order items" ON public.order_items FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND (
      o.restaurant_id = get_user_restaurant_id(auth.uid())
      OR has_role(auth.uid(), 'super_admin')
      OR (auth.uid() IS NULL AND is_restaurant_active(o.restaurant_id))
    )
  ));
CREATE POLICY "Restaurant staff can update order items" ON public.order_items FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id
    AND (o.restaurant_id = get_user_restaurant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'))
  ));

-- WAITER CALLS
CREATE POLICY "Anyone can create waiter calls" ON public.waiter_calls FOR INSERT TO anon, authenticated
  WITH CHECK (
    restaurant_id IS NOT NULL AND is_restaurant_active(restaurant_id)
    AND EXISTS (SELECT 1 FROM public.tables t WHERE t.id = waiter_calls.table_id AND t.restaurant_id = waiter_calls.restaurant_id AND t.is_active = true)
  );
CREATE POLICY "Restaurant staff can view waiter calls" ON public.waiter_calls FOR SELECT TO authenticated
  USING (restaurant_id = get_user_restaurant_id(auth.uid()));
CREATE POLICY "Anon can view waiter calls for active restaurants" ON public.waiter_calls FOR SELECT TO anon
  USING (is_restaurant_active(restaurant_id) AND EXISTS (SELECT 1 FROM tables t WHERE t.id = waiter_calls.table_id AND t.is_active = true) AND status = 'pending' AND created_at > now() - interval '24 hours');
CREATE POLICY "Authenticated customers can view pending waiter calls" ON public.waiter_calls FOR SELECT TO authenticated
  USING (status = 'pending' AND created_at > now() - interval '24 hours' AND is_restaurant_active(restaurant_id) AND EXISTS (SELECT 1 FROM tables t WHERE t.id = waiter_calls.table_id AND t.restaurant_id = waiter_calls.restaurant_id AND t.is_active = true));
CREATE POLICY "Restaurant staff can update waiter calls" ON public.waiter_calls FOR UPDATE TO authenticated
  USING (restaurant_id = get_user_restaurant_id(auth.uid()));

-- FEEDBACK
CREATE POLICY "Anyone can create feedback" ON public.feedback FOR INSERT TO anon, authenticated
  WITH CHECK (
    restaurant_id IS NOT NULL AND rating >= 1 AND rating <= 5 AND is_restaurant_active(restaurant_id)
    AND (table_id IS NULL OR EXISTS (SELECT 1 FROM tables t WHERE t.id = feedback.table_id AND t.is_active = true))
    AND (order_id IS NULL OR EXISTS (SELECT 1 FROM orders o WHERE o.id = feedback.order_id))
  );
CREATE POLICY "Restaurant staff can view feedback" ON public.feedback FOR SELECT TO authenticated
  USING (restaurant_id = get_user_restaurant_id(auth.uid()));

-- SUBSCRIPTION PLANS
CREATE POLICY "Public can view active plans" ON public.subscription_plans FOR SELECT
  USING (is_active = true);
CREATE POLICY "Super admins can manage plans" ON public.subscription_plans FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));

-- ADS
CREATE POLICY "Customers can read active promotions" ON public.ads FOR SELECT TO public
  USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));
CREATE POLICY "Super admins can manage ads" ON public.ads FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Restaurant admins can manage ads" ON public.ads FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'restaurant_admin'));

-- ANALYTICS EVENTS
CREATE POLICY "Anyone can create analytics events" ON public.analytics_events FOR INSERT TO anon, authenticated
  WITH CHECK (event_type IS NOT NULL AND (restaurant_id IS NULL OR is_restaurant_active(restaurant_id)));
CREATE POLICY "Restaurant staff can view analytics" ON public.analytics_events FOR SELECT TO authenticated
  USING (restaurant_id = get_user_restaurant_id(auth.uid()));

-- ANALYTICS DAILY
CREATE POLICY "Restaurant staff can view their analytics" ON public.analytics_daily FOR SELECT
  USING (restaurant_id = get_user_restaurant_id(auth.uid()));
CREATE POLICY "Super admins can view all analytics" ON public.analytics_daily FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

-- CUSTOMER EVENTS
CREATE POLICY "Anyone can create customer events" ON public.customer_events FOR INSERT TO anon, authenticated
  WITH CHECK (restaurant_id IS NOT NULL AND is_restaurant_active(restaurant_id)
    AND (table_id IS NULL OR EXISTS (SELECT 1 FROM tables t WHERE t.id = customer_events.table_id AND t.is_active = true)));
CREATE POLICY "Restaurant staff can view their customer events" ON public.customer_events FOR SELECT
  USING (restaurant_id = get_user_restaurant_id(auth.uid()));

-- COUPONS
CREATE POLICY "Public can view active coupons" ON public.coupons FOR SELECT
  USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (expires_at IS NULL OR expires_at >= now()));
CREATE POLICY "Restaurant staff can manage coupons" ON public.coupons FOR ALL
  USING (restaurant_id = get_user_restaurant_id(auth.uid()));

-- TABLE SESSIONS
CREATE POLICY "Anyone can create table sessions" ON public.table_sessions FOR INSERT TO anon, authenticated
  WITH CHECK (
    restaurant_id IS NOT NULL AND is_restaurant_active(restaurant_id)
    AND EXISTS (SELECT 1 FROM tables t WHERE t.id = table_sessions.table_id AND t.restaurant_id = table_sessions.restaurant_id AND t.is_active = true)
    AND (order_id IS NULL OR EXISTS (SELECT 1 FROM orders o WHERE o.id = table_sessions.order_id AND o.restaurant_id = table_sessions.restaurant_id))
  );
CREATE POLICY "Anon can view active table sessions" ON public.table_sessions FOR SELECT TO anon
  USING (status = ANY(ARRAY['waiting','seated','ordering','served']) AND is_restaurant_active(restaurant_id));
CREATE POLICY "Authenticated staff can view table sessions" ON public.table_sessions FOR SELECT TO authenticated
  USING (restaurant_id = get_user_restaurant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Restaurant staff can update table sessions" ON public.table_sessions FOR UPDATE TO authenticated
  USING (restaurant_id = get_user_restaurant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));

-- PRINTER QUEUE
CREATE POLICY "Restaurant staff can view printer queue" ON public.printer_queue FOR SELECT
  USING (restaurant_id = get_user_restaurant_id(auth.uid()));
CREATE POLICY "Restaurant staff can insert to printer queue" ON public.printer_queue FOR INSERT
  WITH CHECK (restaurant_id = get_user_restaurant_id(auth.uid()));
CREATE POLICY "Restaurant staff can update printer queue" ON public.printer_queue FOR UPDATE
  USING (restaurant_id = get_user_restaurant_id(auth.uid()));
CREATE POLICY "Restaurant staff can delete from printer queue" ON public.printer_queue FOR DELETE
  USING (restaurant_id = get_user_restaurant_id(auth.uid()));

-- INVOICES
CREATE POLICY "Allow invoice operations" ON public.invoices FOR ALL
  USING (restaurant_id = get_user_restaurant_id(auth.uid()))
  WITH CHECK (restaurant_id = get_user_restaurant_id(auth.uid()));

-- INVOICE SYNC LOG
CREATE POLICY "Restaurant staff can view sync logs" ON public.invoice_sync_log FOR SELECT
  USING (restaurant_id = get_user_restaurant_id(auth.uid()));
CREATE POLICY "Restaurant staff can insert sync logs" ON public.invoice_sync_log FOR INSERT
  WITH CHECK (restaurant_id = get_user_restaurant_id(auth.uid()));

-- OFFERS
CREATE POLICY "Public can view active offers" ON public.offers FOR SELECT TO public
  USING (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()) AND is_restaurant_active(restaurant_id));
CREATE POLICY "Restaurant staff can manage offers" ON public.offers FOR ALL
  USING (restaurant_id = get_user_restaurant_id(auth.uid()))
  WITH CHECK (restaurant_id = get_user_restaurant_id(auth.uid()));
CREATE POLICY "Super admins can manage all offers" ON public.offers FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- QR CODES
CREATE POLICY "Restaurant staff can manage their QR codes" ON public.qr_codes FOR ALL
  USING (tenant_id = get_user_restaurant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_restaurant_id(auth.uid()));
CREATE POLICY "Public can view active QR codes" ON public.qr_codes FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- SCAN ANALYTICS
CREATE POLICY "Anyone can insert scan analytics" ON public.scan_analytics FOR INSERT TO public
  WITH CHECK (
    EXISTS (SELECT 1 FROM qr_codes q WHERE q.id = scan_analytics.qr_id AND q.is_active = true)
    AND is_restaurant_active(tenant_id)
  );
CREATE POLICY "Restaurant staff can view their scan analytics" ON public.scan_analytics FOR SELECT
  USING (tenant_id = get_user_restaurant_id(auth.uid()));

-- PAGES
CREATE POLICY "Restaurant staff can manage their pages" ON public.pages FOR ALL
  USING (tenant_id = get_user_restaurant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_restaurant_id(auth.uid()));
CREATE POLICY "Public can view published pages" ON public.pages FOR SELECT TO public
  USING (is_published = true AND is_restaurant_active(tenant_id));

-- VARIANT GROUPS
CREATE POLICY "Public can view variant groups" ON public.variant_groups FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM menu_items mi WHERE mi.id = variant_groups.menu_item_id AND mi.is_available = true AND is_restaurant_active(mi.restaurant_id)));
CREATE POLICY "Restaurant staff can manage variant groups" ON public.variant_groups FOR ALL
  USING (EXISTS (SELECT 1 FROM public.menu_items mi WHERE mi.id = variant_groups.menu_item_id AND mi.restaurant_id = get_user_restaurant_id(auth.uid())));

-- VARIANT OPTIONS
CREATE POLICY "Public can view variant options" ON public.variant_options FOR SELECT TO public
  USING (is_available = true AND EXISTS (SELECT 1 FROM variant_groups vg JOIN menu_items mi ON mi.id = vg.menu_item_id WHERE vg.id = variant_options.variant_group_id AND mi.is_available = true AND is_restaurant_active(mi.restaurant_id)));
CREATE POLICY "Restaurant staff can manage variant options" ON public.variant_options FOR ALL
  USING (EXISTS (SELECT 1 FROM public.variant_groups vg JOIN public.menu_items mi ON mi.id = vg.menu_item_id WHERE vg.id = variant_options.variant_group_id AND mi.restaurant_id = get_user_restaurant_id(auth.uid())));

-- ADDON GROUPS
CREATE POLICY "Public can view addon groups" ON public.addon_groups FOR SELECT TO public
  USING (is_restaurant_active(restaurant_id));
CREATE POLICY "Restaurant staff can manage addon groups" ON public.addon_groups FOR ALL
  USING (restaurant_id = get_user_restaurant_id(auth.uid()));

-- ADDON OPTIONS
CREATE POLICY "Public can view addon options" ON public.addon_options FOR SELECT TO public
  USING (is_available = true AND EXISTS (SELECT 1 FROM addon_groups ag WHERE ag.id = addon_options.addon_group_id AND is_restaurant_active(ag.restaurant_id)));
CREATE POLICY "Restaurant staff can manage addon options" ON public.addon_options FOR ALL
  USING (EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addon_options.addon_group_id AND ag.restaurant_id = get_user_restaurant_id(auth.uid())));

-- INVENTORY ITEMS
CREATE POLICY "Restaurant staff can manage inventory" ON public.inventory_items FOR ALL
  USING (restaurant_id = get_user_restaurant_id(auth.uid()));

-- RECIPE MAPPINGS
CREATE POLICY "Restaurant staff can manage recipes" ON public.recipe_mappings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.menu_items mi WHERE mi.id = recipe_mappings.menu_item_id AND mi.restaurant_id = get_user_restaurant_id(auth.uid())));

-- PLATFORM SETTINGS
CREATE POLICY "Super admins can read platform settings" ON public.platform_settings FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can update platform settings" ON public.platform_settings FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can insert platform settings" ON public.platform_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- DEFAULT TAX SETTINGS
CREATE POLICY "Super admins can read default tax settings" ON public.default_tax_settings FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can update default tax settings" ON public.default_tax_settings FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can insert default tax settings" ON public.default_tax_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- EMAIL TEMPLATES
CREATE POLICY "Super admins can manage email templates" ON public.email_templates FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- SYSTEM LOGS
CREATE POLICY "Super admins can view system logs" ON public.system_logs FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Deny direct inserts to system logs" ON public.system_logs FOR INSERT
  WITH CHECK (false);

-- LANDING PAGE SECTIONS
CREATE POLICY "Super admins can manage landing sections" ON public.landing_page_sections FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Public can view visible landing sections" ON public.landing_page_sections FOR SELECT
  USING (is_visible = true);

-- SUPER ADMIN PROFILE
CREATE POLICY "Super admins can manage profiles" ON public.super_admin_profile FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- ENTERPRISE PROMOTIONS
CREATE POLICY "Public can view active promotions" ON public.enterprise_promotions FOR SELECT
  USING (status = 'active' AND start_date <= now() AND end_date >= now());
CREATE POLICY "Superadmins can do everything on promotions" ON public.enterprise_promotions FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- ENTERPRISE REVIEWS
CREATE POLICY "Public can insert reviews" ON public.enterprise_reviews FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Admins select campaign events" ON public.campaign_events FOR SELECT TO authenticated
  USING (true);

-- CAMPAIGN EVENTS
CREATE POLICY "Public insert campaign events" ON public.campaign_events FOR INSERT TO public
  WITH CHECK (true);

-- COUPON REDEMPTIONS
CREATE POLICY "Public insert coupon redemptions" ON public.coupon_redemptions FOR INSERT TO public
  WITH CHECK (true);
CREATE POLICY "Admins select coupon redemptions" ON public.coupon_redemptions FOR SELECT TO authenticated
  USING (true);

-- QUOTE REQUESTS
CREATE POLICY "Anyone can submit quote requests" ON public.quote_requests FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Super admins can view quote requests" ON public.quote_requests FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));

-- NEWSLETTER SUBSCRIBERS
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Super admins can view subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));


-- ============================================================
-- SECTION 9: STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images', 'menu-images', true, 52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('platform-assets', 'platform-assets', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- menu-images policies
CREATE POLICY "Public can view menu images" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'menu-images');
CREATE POLICY "Authenticated users can upload menu images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'menu-images');
CREATE POLICY "Authenticated users can update menu images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'menu-images');
CREATE POLICY "Authenticated users can delete menu images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'menu-images');

-- platform-assets policies
CREATE POLICY "Anyone can view platform assets" ON storage.objects FOR SELECT
  USING (bucket_id = 'platform-assets');
CREATE POLICY "Super admins can upload platform assets" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'platform-assets' AND public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can update platform assets" ON storage.objects FOR UPDATE
  USING (bucket_id = 'platform-assets' AND public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can delete platform assets" ON storage.objects FOR DELETE
  USING (bucket_id = 'platform-assets' AND public.has_role(auth.uid(), 'super_admin'));

-- avatars policies
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Avatars are publicly viewable" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');


-- ============================================================
-- SECTION 10: REALTIME PUBLICATIONS
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.waiter_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.printer_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_daily;
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.qr_codes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scan_analytics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.landing_page_sections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coupon_redemptions;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'restaurants') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurants;
  END IF;
END $$;


-- ============================================================
-- SECTION 11: STATIC SEED DATA
-- ============================================================

-- Subscription plans
INSERT INTO public.subscription_plans (name, tier, price_monthly, price_yearly, max_tables, max_orders_per_month, features) VALUES
  ('Free', 'free', 0, 0, 1, 50, '{"basic_menu":true,"qr_codes":true}'),
  ('Pro', 'pro', 999, 9990, 20, 1000, '{"basic_menu":true,"qr_codes":true,"analytics":true,"priority_support":true}'),
  ('Enterprise', 'enterprise', 2999, 29990, -1, -1, '{"basic_menu":true,"qr_codes":true,"analytics":true,"priority_support":true,"api_access":true,"white_label":true}');

-- Platform settings
INSERT INTO public.platform_settings (platform_name, creator_email)
VALUES ('QR Dine Pro', 'arunpandi47777@gmail.com');

-- Default tax settings
INSERT INTO public.default_tax_settings (gst_percent, service_charge_percent, vat_percent, tax_mode, currency)
VALUES (5.00, 0.00, 0.00, 'exclusive', 'INR');

-- Email templates
INSERT INTO public.email_templates (template_name, subject, body_html, variables_json) VALUES
('admin_credentials', 'Your Admin Login Credentials', '<h1>Welcome to {{restaurant_name}}</h1><p>Email: {{admin_email}}</p><p>Password: {{temporary_password}}</p><p><a href="{{login_url}}">Login here</a></p>', '["restaurant_name","admin_email","temporary_password","login_url"]'::jsonb),
('staff_invite', 'Staff Account Created', '<h1>Welcome to {{restaurant_name}}</h1><p>Your account has been created.</p><p>Email: {{admin_email}}</p><p>Password: {{temporary_password}}</p><p><a href="{{login_url}}">Login here</a></p>', '["restaurant_name","admin_email","temporary_password","login_url"]'::jsonb),
('subscription_invoice', 'Subscription Invoice - {{restaurant_name}}', '<h1>Invoice</h1><p>Restaurant: {{restaurant_name}}</p><p>Amount: {{amount}}</p><p>Period: {{period}}</p>', '["restaurant_name","amount","period"]'::jsonb),
('password_reset', 'Password Reset Request', '<h1>Password Reset</h1><p><a href="{{reset_url}}">Reset Password</a></p>', '["reset_url","admin_email"]'::jsonb),
('trial_expiry', 'Trial Expiring Soon - {{restaurant_name}}', '<h1>Trial Expiring</h1><p>Your trial for {{restaurant_name}} expires on {{expiry_date}}.</p><p><a href="{{upgrade_url}}">Upgrade now</a></p>', '["restaurant_name","expiry_date","upgrade_url"]'::jsonb);

-- Landing page sections
INSERT INTO public.landing_page_sections (section_key, content_json, display_order) VALUES
('hero', '{"title":"Smart QR-Based Restaurant Management","subtitle":"Transform your restaurant operations with intelligent digital ordering, real-time kitchen sync, and powerful analytics.","cta_text":"Get Started Free","cta_link":"/admin/login","badge_text":"🚀 Trusted by 500+ restaurants"}', 1),
('features', '{"heading":"Everything You Need","subheading":"Powerful features to run your restaurant","items":[{"icon":"QrCode","title":"QR Ordering","description":"Contactless digital menu and ordering"},{"icon":"ChefHat","title":"Kitchen Display","description":"Real-time order management"},{"icon":"BarChart3","title":"Analytics","description":"Revenue and performance insights"},{"icon":"CreditCard","title":"Smart Billing","description":"Automated invoicing and payments"}]}', 2),
('how_it_works', '{"heading":"How It Works","steps":[{"step":1,"title":"Scan QR Code","description":"Customers scan the table QR"},{"step":2,"title":"Browse & Order","description":"Select items from digital menu"},{"step":3,"title":"Kitchen Receives","description":"Orders appear on kitchen display"},{"step":4,"title":"Serve & Bill","description":"Track, serve, and generate invoice"}]}', 3),
('pricing', '{"heading":"Simple, Transparent Pricing","subheading":"Choose the plan that fits your restaurant"}', 4),
('testimonials', '{"heading":"Loved by Restaurant Owners","items":[{"name":"Rajesh Kumar","role":"Owner, Spice Garden","quote":"Increased our order efficiency by 40%","avatar":""},{"name":"Priya Sharma","role":"Manager, The Food Court","quote":"Best investment for our restaurant chain","avatar":""}]}', 5),
('cta_banner', '{"headline":"Ready to Transform Your Restaurant?","subtitle":"Join hundreds of restaurants already using QR Dine Pro","cta_text":"Start Free Trial","cta_link":"/admin/login"}', 6),
('footer', '{"company_name":"QR Dine Pro","tagline":"Smart Restaurant Management","links":[{"label":"Features","href":"#features"},{"label":"Pricing","href":"#pricing"},{"label":"Contact","href":"mailto:support@qrdinepro.com"}]}', 7)
ON CONFLICT (section_key) DO NOTHING;


-- ============================================================
-- END OF MASTER MIGRATION
-- Run 02_SEED_ADMIN_USER.sql next
-- ============================================================
