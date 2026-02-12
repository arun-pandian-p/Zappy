
-- Add theme_config JSONB and onboarding_completed to restaurants
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS theme_config jsonb DEFAULT '{"preset": "classic", "custom_primary": null, "custom_secondary": null, "custom_font": null, "button_style": "rounded"}'::jsonb;

ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
