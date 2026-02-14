
CREATE TABLE public.invoice_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  response jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.invoice_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant staff can view sync logs"
  ON public.invoice_sync_log FOR SELECT
  USING (restaurant_id = get_user_restaurant_id(auth.uid()));

CREATE POLICY "Restaurant staff can insert sync logs"
  ON public.invoice_sync_log FOR INSERT
  WITH CHECK (restaurant_id = get_user_restaurant_id(auth.uid()));
