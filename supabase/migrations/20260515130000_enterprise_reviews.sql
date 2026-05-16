-- ENTERPRISE AI REVIEW ECOSYSTEM

-- Enums
CREATE TYPE review_sentiment AS ENUM ('positive', 'neutral', 'negative', 'angry');
CREATE TYPE review_status AS ENUM ('published', 'pending_moderation', 'resolved', 'escalated');
CREATE TYPE review_source AS ENUM ('in_app', 'qr', 'sms', 'whatsapp', 'email');

-- Main Reviews Table
CREATE TABLE IF NOT EXISTS enterprise_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  table_id UUID REFERENCES tables(id),
  customer_id UUID, -- Optional if guest
  
  -- Core Ratings (1-5 stars)
  overall_rating INT NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  food_rating INT,
  service_rating INT,
  ambiance_rating INT,
  cleanliness_rating INT,
  delivery_rating INT,
  
  -- Content
  comment TEXT,
  source review_source DEFAULT 'in_app',
  status review_status DEFAULT 'published',
  
  -- Redirections
  redirected_to_google BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- AI Insights Table (1:1 with reviews)
CREATE TABLE IF NOT EXISTS review_ai_insights (
  review_id UUID PRIMARY KEY REFERENCES enterprise_reviews(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  
  sentiment review_sentiment NOT NULL,
  sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
  
  -- Categorization
  is_complaint BOOLEAN DEFAULT false,
  complaint_categories TEXT[], -- e.g., ['cold_food', 'slow_service']
  positive_highlights TEXT[], -- e.g., ['great_biryani', 'friendly_staff']
  
  -- Auto-generated responses
  suggested_reply TEXT,
  requires_manager_attention BOOLEAN DEFAULT false,
  fraud_score DECIMAL(3,2) DEFAULT 0.0, -- > 0.8 flags as potential spam
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Review Recovery Workflows (For 1-3 star reviews)
CREATE TABLE IF NOT EXISTS review_recoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES enterprise_reviews(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  
  status TEXT DEFAULT 'pending', -- pending, action_taken, resolved, failed
  manager_notes TEXT,
  
  -- Resolution action
  action_type TEXT, -- 'coupon_issued', 'apology_sent', 'refund_initiated', 'called_customer'
  coupon_code TEXT,
  discount_value DECIMAL(10,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Aggregated Analytics View / Table
CREATE TABLE IF NOT EXISTS customer_satisfaction_scores (
  restaurant_id UUID PRIMARY KEY REFERENCES restaurants(id) ON DELETE CASCADE,
  date_calculated DATE NOT NULL,
  
  average_rating DECIMAL(3,2),
  total_reviews INT,
  nps_score INT, -- Net Promoter Score
  
  positive_sentiment_pct DECIMAL(5,2),
  negative_sentiment_pct DECIMAL(5,2),
  
  top_complaints TEXT[],
  top_praises TEXT[],
  
  recovery_success_rate DECIMAL(5,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(restaurant_id, date_calculated)
);

-- RLS Policies
ALTER TABLE enterprise_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_recoveries ENABLE ROW LEVEL SECURITY;

-- Allow public insertion of reviews
CREATE POLICY "Public can insert reviews" ON enterprise_reviews FOR INSERT WITH CHECK (true);

-- Allow restaurants to view their reviews
CREATE POLICY "Restaurants can view own reviews" ON enterprise_reviews FOR SELECT USING (
  restaurant_id IN (SELECT restaurant_id FROM tenant_members WHERE user_id = auth.uid())
);
CREATE POLICY "Restaurants can view own insights" ON review_ai_insights FOR SELECT USING (
  restaurant_id IN (SELECT restaurant_id FROM tenant_members WHERE user_id = auth.uid())
);
CREATE POLICY "Restaurants can view/update own recoveries" ON review_recoveries FOR ALL USING (
  restaurant_id IN (SELECT restaurant_id FROM tenant_members WHERE user_id = auth.uid())
);
