const { Client } = require('pg');

const client = new Client({
  host: 'db.yqdblmkqlnhtbztpfuwm.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'aRUNOLIVER2030@',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected to DB');

  const sql = `
    ALTER TABLE public.restaurants 
    ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS theme_config jsonb DEFAULT '{"preset": "classic", "button_style": "rounded"}'::jsonb,
    ADD COLUMN IF NOT EXISTS feature_toggles jsonb DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS ads_enabled boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS banner_image_url text,
    ADD COLUMN IF NOT EXISTS favicon_url text,
    ADD COLUMN IF NOT EXISTS font_family text,
    ADD COLUMN IF NOT EXISTS menu_title text,
    ADD COLUMN IF NOT EXISTS city text,
    ADD COLUMN IF NOT EXISTS state text,
    ADD COLUMN IF NOT EXISTS country text,
    ADD COLUMN IF NOT EXISTS postal_code text,
    ADD COLUMN IF NOT EXISTS latitude double precision,
    ADD COLUMN IF NOT EXISTS longitude double precision,
    ADD COLUMN IF NOT EXISTS google_place_id text,
    ADD COLUMN IF NOT EXISTS google_place_name text,
    ADD COLUMN IF NOT EXISTS google_rating numeric(3,2),
    ADD COLUMN IF NOT EXISTS google_user_ratings_total integer,
    ADD COLUMN IF NOT EXISTS google_reviews_cache jsonb,
    ADD COLUMN IF NOT EXISTS google_maps_url text,
    ADD COLUMN IF NOT EXISTS google_formatted_address text,
    ADD COLUMN IF NOT EXISTS google_sync_status text,
    ADD COLUMN IF NOT EXISTS google_synced_at timestamptz,
    ADD COLUMN IF NOT EXISTS google_sync_error text,
    ADD COLUMN IF NOT EXISTS subscription_ends_at timestamptz;

    -- Also set onboarding_completed = true for the demo restaurant
    UPDATE public.restaurants SET onboarding_completed = true WHERE id = '00000000-0000-0000-0000-000000000001';

    NOTIFY pgrst, 'reload schema';
  `;

  await client.query(sql);
  console.log('SUCCESS: Columns added, onboarding_completed updated, and PostgREST schema cache notified!');
  await client.end();
}

run().catch(console.error);

