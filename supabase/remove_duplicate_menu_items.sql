-- Zappy Database Clean-up Tool: Remove Duplicate Menu Items
-- Safely finds and deletes duplicate menu items (same name & same restaurant),
-- preserving the first seeded record (earliest created_at date).
-- Cascading foreign keys will automatically clean up variant groups/options.

DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 1. Create a temporary table or run a single-statement safe delete
    WITH ranked_menu_items AS (
        SELECT 
            id,
            name,
            restaurant_id,
            ROW_NUMBER() OVER (
                PARTITION BY LOWER(TRIM(name)), restaurant_id 
                ORDER BY created_at ASC, id ASC
            ) as rank
        FROM public.menu_items
    ),
    duplicates_to_delete AS (
        SELECT id 
        FROM ranked_menu_items 
        WHERE rank > 1
    )
    DELETE FROM public.menu_items
    WHERE id IN (SELECT id FROM duplicates_to_delete);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Clean-up complete! Safely removed % duplicate menu items from Zappy database.', deleted_count;
END $$;
