-- Migration: Add AI caching and global assets tables

-- 1. ai_cache
CREATE TABLE IF NOT EXISTS public.ai_cache (
  hash text PRIMARY KEY,
  feature text NOT NULL,
  input text NOT NULL,
  response text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for ai_cache
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

-- Policies for ai_cache: allow all reads and authenticated inserts
CREATE POLICY "Allow public read on ai_cache" 
  ON public.ai_cache FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated insert on ai_cache" 
  ON public.ai_cache FOR INSERT TO authenticated WITH CHECK (true);


-- 2. ai_food_images
CREATE TABLE IF NOT EXISTS public.ai_food_images (
  name text PRIMARY KEY,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for ai_food_images
ALTER TABLE public.ai_food_images ENABLE ROW LEVEL SECURITY;

-- Policies for ai_food_images: allow all reads and authenticated inserts
CREATE POLICY "Allow public read on ai_food_images" 
  ON public.ai_food_images FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated insert on ai_food_images" 
  ON public.ai_food_images FOR INSERT TO authenticated WITH CHECK (true);


-- 3. ai_descriptions
CREATE TABLE IF NOT EXISTS public.ai_descriptions (
  name text PRIMARY KEY,
  short_description text NOT NULL,
  medium_description text NOT NULL,
  seo_description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for ai_descriptions
ALTER TABLE public.ai_descriptions ENABLE ROW LEVEL SECURITY;

-- Policies for ai_descriptions: allow all reads and authenticated inserts
CREATE POLICY "Allow public read on ai_descriptions" 
  ON public.ai_descriptions FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated insert on ai_descriptions" 
  ON public.ai_descriptions FOR INSERT TO authenticated WITH CHECK (true);


-- 4. ai_translations
CREATE TABLE IF NOT EXISTS public.ai_translations (
  hash text PRIMARY KEY,
  source_text text NOT NULL,
  target_lang text NOT NULL,
  translated_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for ai_translations
ALTER TABLE public.ai_translations ENABLE ROW LEVEL SECURITY;

-- Policies for ai_translations: allow all reads and authenticated inserts
CREATE POLICY "Allow public read on ai_translations" 
  ON public.ai_translations FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated insert on ai_translations" 
  ON public.ai_translations FOR INSERT TO authenticated WITH CHECK (true);


-- 5. ai_embeddings
CREATE TABLE IF NOT EXISTS public.ai_embeddings (
  hash text PRIMARY KEY,
  text_content text NOT NULL,
  embedding vector(1536) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for ai_embeddings
ALTER TABLE public.ai_embeddings ENABLE ROW LEVEL SECURITY;

-- Policies for ai_embeddings: allow all reads and authenticated inserts
CREATE POLICY "Allow public read on ai_embeddings" 
  ON public.ai_embeddings FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated insert on ai_embeddings" 
  ON public.ai_embeddings FOR INSERT TO authenticated WITH CHECK (true);
