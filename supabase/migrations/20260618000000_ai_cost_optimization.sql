-- AI Cost Optimization: Add TTL, eviction, and indexes

ALTER TABLE public.ai_cache ADD COLUMN IF NOT EXISTS expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_ai_cache_feature ON public.ai_cache(feature);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON public.ai_cache(expires_at) WHERE expires_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.evict_expired_ai_cache()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count int;
BEGIN
  DELETE FROM public.ai_cache
  WHERE expires_at IS NOT NULL AND expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_token_budget(restaurant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tier text;
  daily_limit int;
  monthly_limit int;
BEGIN
  SELECT subscription_tier INTO tier FROM public.restaurants WHERE id = restaurant_id;
  CASE tier
    WHEN 'free' THEN daily_limit := 50000; monthly_limit := 500000;
    WHEN 'basic' THEN daily_limit := 100000; monthly_limit := 1000000;
    WHEN 'pro' THEN daily_limit := 500000; monthly_limit := 5000000;
    WHEN 'enterprise' THEN daily_limit := 2000000; monthly_limit := 20000000;
    ELSE daily_limit := 50000; monthly_limit := 500000;
  END CASE;
  RETURN jsonb_build_object('daily', daily_limit, 'monthly', monthly_limit, 'tier', tier);
END;
$$;

ALTER TABLE public.ai_embeddings ADD COLUMN IF NOT EXISTS hit_count int DEFAULT 0;
ALTER TABLE public.ai_embeddings ADD COLUMN IF NOT EXISTS last_accessed timestamptz;

CREATE INDEX IF NOT EXISTS idx_ai_embeddings_hit_count ON public.ai_embeddings(hit_count DESC);

ALTER TABLE public.ai_cache ADD COLUMN IF NOT EXISTS hit_count int DEFAULT 0;
ALTER TABLE public.ai_food_images ADD COLUMN IF NOT EXISTS hit_count int DEFAULT 0;
ALTER TABLE public.ai_descriptions ADD COLUMN IF NOT EXISTS hit_count int DEFAULT 0;
ALTER TABLE public.ai_translations ADD COLUMN IF NOT EXISTS hit_count int DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_embedding_hit(hash_text text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ai_embeddings
  SET hit_count = COALESCE(hit_count, 0) + 1,
      last_accessed = now()
  WHERE hash = hash_text;
END;
$$;
