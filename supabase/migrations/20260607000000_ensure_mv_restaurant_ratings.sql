-- Ensure mv_restaurant_ratings exists and is kept fresh
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_restaurant_ratings AS
SELECT 
    restaurant_id,
    COALESCE(AVG(overall_rating), 0.0) as average_rating,
    COUNT(*) as total_reviews
FROM public.enterprise_reviews
GROUP BY restaurant_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_restaurant_ratings_restaurant_id ON public.mv_restaurant_ratings (restaurant_id);

-- Refresh materialized view concurrently to avoid locking
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_restaurant_ratings;

-- Trigger to refresh materialized view on enterprise_reviews changes
CREATE OR REPLACE FUNCTION public.refresh_restaurant_ratings_if_exists()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'mv_restaurant_ratings' AND relkind = 'm') THEN
    PERFORM REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_restaurant_ratings;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_refresh_ratings ON public.enterprise_reviews;
CREATE TRIGGER trigger_refresh_ratings
AFTER INSERT OR UPDATE OR DELETE ON public.enterprise_reviews
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_restaurant_ratings_if_exists();
