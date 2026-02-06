-- Add timing columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS started_preparing_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ;

-- Create analytics_daily table for aggregated metrics
CREATE TABLE IF NOT EXISTS public.analytics_daily (
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

-- Enable RLS on analytics_daily
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;

-- RLS policies for analytics_daily
CREATE POLICY "Restaurant staff can view their analytics"
ON public.analytics_daily
FOR SELECT
USING (restaurant_id = get_user_restaurant_id(auth.uid()));

CREATE POLICY "Super admins can view all analytics"
ON public.analytics_daily
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

-- Create customer_events table for behavior tracking
CREATE TABLE IF NOT EXISTS public.customer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  session_id TEXT,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on customer_events
ALTER TABLE public.customer_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for customer_events
CREATE POLICY "Anyone can create customer events"
ON public.customer_events
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Restaurant staff can view their customer events"
ON public.customer_events
FOR SELECT
USING (restaurant_id = get_user_restaurant_id(auth.uid()));

-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
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

-- Enable RLS on coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- RLS policies for coupons
CREATE POLICY "Public can view active coupons"
ON public.coupons
FOR SELECT
USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (expires_at IS NULL OR expires_at >= now()));

CREATE POLICY "Restaurant staff can manage coupons"
ON public.coupons
FOR ALL
USING (restaurant_id = get_user_restaurant_id(auth.uid()));

-- Create table_sessions table for timer system
CREATE TABLE IF NOT EXISTS public.table_sessions (
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

-- Enable RLS on table_sessions
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for table_sessions
CREATE POLICY "Anyone can view table sessions by restaurant"
ON public.table_sessions
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create table sessions"
ON public.table_sessions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Restaurant staff can update table sessions"
ON public.table_sessions
FOR UPDATE
USING (restaurant_id = get_user_restaurant_id(auth.uid()) OR (auth.uid() IS NULL AND restaurant_id = '00000000-0000-0000-0000-000000000001'::uuid));

-- Add branding columns to restaurants
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
ADD COLUMN IF NOT EXISTS favicon_url TEXT,
ADD COLUMN IF NOT EXISTS menu_title TEXT;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_daily;
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_sessions;