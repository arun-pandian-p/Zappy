-- Migration: AI Menu Enrichment, OCR tracking, and Image Discovery Engine Schema
-- Date: June 5, 2026

-- 1. OCR Imports Tracking Table
CREATE TABLE IF NOT EXISTS public.ocr_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    file_path TEXT,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'success', 'failed', 'needs_review')),
    raw_ocr_text TEXT,
    extracted_menu JSONB, 
    confidence_score NUMERIC(5,2), 
    processing_time_ms INT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on ocr_imports
ALTER TABLE public.ocr_imports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ocr_imports
CREATE POLICY "Public read ocr_imports" ON public.ocr_imports FOR SELECT USING (true);
CREATE POLICY "Staff manage ocr_imports" ON public.ocr_imports FOR ALL USING (
    restaurant_id IN (
        SELECT restaurant_id FROM public.staff_profiles WHERE user_id = auth.uid()
    )
);

-- 2. AI Enrichments Table
CREATE TABLE IF NOT EXISTS public.ai_enrichments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE UNIQUE NOT NULL,
    short_description TEXT,
    medium_description TEXT,
    seo_description TEXT,
    calories INT,
    protein NUMERIC(5,2),
    carbs NUMERIC(5,2),
    fat NUMERIC(5,2),
    allergens TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    upsell_recommendations JSONB DEFAULT '[]', 
    image_search_queries TEXT[] DEFAULT '{}', 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on ai_enrichments
ALTER TABLE public.ai_enrichments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_enrichments
CREATE POLICY "Public read ai_enrichments" ON public.ai_enrichments FOR SELECT USING (true);
CREATE POLICY "Staff manage ai_enrichments" ON public.ai_enrichments FOR ALL USING (
    menu_item_id IN (
        SELECT id FROM public.menu_items WHERE restaurant_id IN (
            SELECT restaurant_id FROM public.staff_profiles WHERE user_id = auth.uid()
        )
    )
);

-- 3. Image Discovery Engine Logs Table
CREATE TABLE IF NOT EXISTS public.image_discoveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE NOT NULL,
    query_used TEXT NOT NULL,
    candidate_url TEXT NOT NULL,
    source_platform TEXT NOT NULL CHECK (source_platform IN ('unsplash', 'pexels', 'pixabay', 'wikimedia')),
    visual_confidence_score NUMERIC(5,2) NOT NULL, 
    aesthetic_quality_score NUMERIC(5,2) NOT NULL, 
    rejection_reason TEXT, 
    is_selected BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on image_discoveries
ALTER TABLE public.image_discoveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for image_discoveries
CREATE POLICY "Public read image_discoveries" ON public.image_discoveries FOR SELECT USING (true);
CREATE POLICY "Staff manage image_discoveries" ON public.image_discoveries FOR ALL USING (
    menu_item_id IN (
        SELECT id FROM public.menu_items WHERE restaurant_id IN (
            SELECT restaurant_id FROM public.staff_profiles WHERE user_id = auth.uid()
        )
    )
);

-- 4. OCR & AI Analytics Table
CREATE TABLE IF NOT EXISTS public.ocr_analytics_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('ocr_import', 'ai_enrich', 'image_match')),
    is_success BOOLEAN NOT NULL,
    processing_time_ms INT NOT NULL,
    manual_corrections_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on ocr_analytics_metrics
ALTER TABLE public.ocr_analytics_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ocr_analytics_metrics
CREATE POLICY "Public read ocr_analytics" ON public.ocr_analytics_metrics FOR SELECT USING (true);
CREATE POLICY "Staff manage ocr_analytics" ON public.ocr_analytics_metrics FOR ALL USING (
    restaurant_id IN (
        SELECT restaurant_id FROM public.staff_profiles WHERE user_id = auth.uid()
    )
);

-- Index optimization for faster queries
CREATE INDEX IF NOT EXISTS idx_ocr_imports_restaurant ON public.ocr_imports(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ai_enrichments_item ON public.ai_enrichments(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_image_discoveries_item ON public.image_discoveries(menu_item_id);
