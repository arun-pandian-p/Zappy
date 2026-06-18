-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column of type vector(1536) to menu_items table
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create match_menu_items RPC function for cosine similarity matching
CREATE OR REPLACE FUNCTION public.match_menu_items(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  r_id uuid
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  price numeric,
  image_url text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    menu_items.id,
    menu_items.name,
    menu_items.description,
    menu_items.price::numeric,
    menu_items.image_url,
    (1 - (menu_items.embedding <=> query_embedding))::float AS similarity
  FROM public.menu_items
  WHERE menu_items.restaurant_id = r_id
    AND menu_items.embedding IS NOT NULL
    AND 1 - (menu_items.embedding <=> query_embedding) > match_threshold
  ORDER BY menu_items.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
