-- Rebrand landing page footer from legacy "QR Dine Pro" to Zappy
UPDATE public.landing_page_sections
SET content_json = jsonb_set(
  content_json,
  '{company_name}',
  '"Zappy"'
)
WHERE section_key = 'footer'
  AND content_json->>'company_name' = 'QR Dine Pro';
