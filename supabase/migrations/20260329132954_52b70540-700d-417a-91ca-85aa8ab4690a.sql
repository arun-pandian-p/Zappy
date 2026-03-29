
-- Fix: Make orders_public view use SECURITY INVOKER
CREATE OR REPLACE VIEW public.orders_public
WITH (security_invoker = on) AS
SELECT
  id, restaurant_id, table_id, order_number, status,
  subtotal, tax_amount, service_charge, total_amount,
  payment_method, payment_status, special_instructions,
  estimated_ready_at, started_preparing_at, ready_at,
  created_at, updated_at
FROM public.orders
WHERE table_id IS NOT NULL
  AND created_at > now() - interval '24 hours';
