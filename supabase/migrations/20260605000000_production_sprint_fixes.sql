-- 1. Enforce one review per order at DB level
ALTER TABLE public.enterprise_reviews DROP CONSTRAINT IF EXISTS unique_order_review;
ALTER TABLE public.enterprise_reviews ADD CONSTRAINT unique_order_review UNIQUE (order_id);

-- 2. Add active status column to tables
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- 3. Create food_pairings table for Recommendation Engine
CREATE TABLE IF NOT EXISTS public.food_pairings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    paired_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    weight DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(restaurant_id, item_id, paired_item_id)
);
ALTER TABLE public.food_pairings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view food pairings" ON public.food_pairings FOR SELECT USING (true);
CREATE POLICY "Admins can manage food pairings" ON public.food_pairings FOR ALL USING (
  restaurant_id IN (SELECT restaurant_id FROM user_roles WHERE user_id = auth.uid())
);

-- 4. Add platform ads consent column to restaurants
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS accept_platform_ads boolean DEFAULT true;

-- 5. Create promotions analytics table for impression & click tracking
CREATE TABLE IF NOT EXISTS public.promotions_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    promotion_id UUID REFERENCES ads(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'impression' or 'click'
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.promotions_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert promotion analytics" ON public.promotions_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can select promotion analytics" ON public.promotions_analytics FOR SELECT USING (
  restaurant_id IN (SELECT restaurant_id FROM user_roles WHERE user_id = auth.uid())
);

-- 6. Ratings Aggregate Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_restaurant_ratings AS
SELECT 
    restaurant_id,
    COALESCE(AVG(overall_rating), 0.0) as average_rating,
    COUNT(*) as total_reviews
FROM public.enterprise_reviews
GROUP BY restaurant_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_restaurant_ratings_restaurant_id ON public.mv_restaurant_ratings (restaurant_id);

-- Trigger to refresh materialized view concurrently on new reviews
CREATE OR REPLACE FUNCTION public.refresh_restaurant_ratings()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_restaurant_ratings;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_refresh_ratings
AFTER INSERT OR UPDATE OR DELETE ON public.enterprise_reviews
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_restaurant_ratings();

-- 7. Storage Bucket per-tenant isolation RLS policies
DROP POLICY IF EXISTS "Public can view menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete menu images" ON storage.objects;

-- Allow public read of menu images
CREATE POLICY "Public can view menu images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'menu-images');

-- Enforce folder name matches JWT restaurant_id metadata (per-tenant isolation)
CREATE POLICY "Authenticated users can upload menu images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'menu-images' AND (storage.foldername(name))[1] = auth.jwt()->>'restaurant_id');

CREATE POLICY "Authenticated users can update menu images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'menu-images' AND (storage.foldername(name))[1] = auth.jwt()->>'restaurant_id');

CREATE POLICY "Authenticated users can delete menu images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'menu-images' AND (storage.foldername(name))[1] = auth.jwt()->>'restaurant_id');

-- 8. Add item snapshot to order_items to preserve historical data
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS item_snapshot JSONB;

-- Update foreign key constraint on item_id to be ON DELETE SET NULL
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_item_id_fkey;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.menu_items(id) ON DELETE SET NULL;
