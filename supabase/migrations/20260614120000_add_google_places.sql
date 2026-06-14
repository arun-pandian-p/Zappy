-- Add Google Places Integration columns to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS google_place_id TEXT,
ADD COLUMN IF NOT EXISTS google_review_url TEXT,
ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

-- For backwards compatibility if old feedback tables still exist
-- (Ensures enterprise_reviews is safe for inserting bad reviews)
CREATE TABLE IF NOT EXISTS public.customer_feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for customer_feedback
ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to customer_feedback"
    ON public.customer_feedback FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow tenant read customer_feedback"
    ON public.customer_feedback FOR SELECT
    USING (restaurant_id IN (
        SELECT r.id FROM restaurants r
        WHERE r.tenant_id = (SELECT auth.uid())
    ));
