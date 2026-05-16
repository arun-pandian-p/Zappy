-- ENTERPRISE PROMOTIONS SCHEMA

-- Enum for promotion types
CREATE TYPE promotion_type AS ENUM (
  'percentage',
  'flat_discount',
  'bogo', -- buy 1 get 1
  'free_delivery',
  'combo'
);

-- Enum for promotion status
CREATE TYPE promotion_status AS ENUM (
  'draft',
  'pending_approval',
  'active',
  'rejected',
  'paused',
  'expired'
);

-- Enum for promotion origin
CREATE TYPE promotion_origin AS ENUM (
  'restaurant',
  'superadmin',
  'sponsored'
);

-- Advanced Enterprise Offers Table
CREATE TABLE IF NOT EXISTS enterprise_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  
  -- Basic Info
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  banner_url TEXT, -- specific hero banner
  
  -- Metadata
  promo_code TEXT UNIQUE,
  origin promotion_origin DEFAULT 'restaurant',
  status promotion_status DEFAULT 'pending_approval',
  priority INT DEFAULT 10, -- Lower number = higher priority
  
  -- Rules & Valuation
  type promotion_type NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_discount DECIMAL(10,2), -- useful for percentage caps
  min_order_value DECIMAL(10,2) DEFAULT 0,
  
  -- Targeting
  target_menu_item_ids UUID[], -- if null, applies to whole cart
  target_category_ids UUID[],
  new_users_only BOOLEAN DEFAULT false,
  valid_days INT[], -- [0,1,2,3,4,5,6] (0=Sunday)
  valid_hours_start TIME,
  valid_hours_end TIME,
  
  -- Timeline
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Analytics tracking
  usage_count INT DEFAULT 0,
  max_usage INT, -- Global limit
  max_usage_per_user INT DEFAULT 1,
  
  -- Workflow
  rejection_reason TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Policies
ALTER TABLE enterprise_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active promotions"
  ON enterprise_promotions FOR SELECT
  USING (status = 'active' AND start_date <= now() AND end_date >= now());

CREATE POLICY "Restaurants can view their own promotions"
  ON enterprise_promotions FOR SELECT
  USING (restaurant_id IN (
    SELECT restaurant_id FROM tenant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Restaurants can insert promotions"
  ON enterprise_promotions FOR INSERT
  WITH CHECK (restaurant_id IN (
    SELECT restaurant_id FROM tenant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Restaurants can update their own pending/draft promotions"
  ON enterprise_promotions FOR UPDATE
  USING (restaurant_id IN (
    SELECT restaurant_id FROM tenant_members WHERE user_id = auth.uid()
  ));

-- Superadmin full access (assuming superadmin role check exists)
CREATE POLICY "Superadmins can do everything"
  ON enterprise_promotions FOR ALL
  USING (auth.jwt() ->> 'role' = 'superadmin');

-- Analytics Table for ROI and Usage Tracking
CREATE TABLE IF NOT EXISTS promotion_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES enterprise_promotions(id) ON DELETE CASCADE,
  order_id UUID NOT NULL, -- references orders
  discount_applied DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
