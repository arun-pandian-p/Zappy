-- Add new columns to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS printer_settings jsonb DEFAULT '{"type": "none", "address": null, "auto_print_kitchen": false, "auto_print_billing": true}'::jsonb,
ADD COLUMN IF NOT EXISTS review_settings jsonb DEFAULT '{"enabled": true, "google_redirect_threshold": 4, "google_review_url": null}'::jsonb,
ADD COLUMN IF NOT EXISTS ads_enabled boolean DEFAULT true;

-- Create printer_queue table for offline print fallback
CREATE TABLE public.printer_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  receipt_type text NOT NULL DEFAULT 'kitchen', -- 'kitchen' or 'billing'
  receipt_data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'printing', 'completed', 'failed'
  attempts integer DEFAULT 0,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create invoices table for completed billing records
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  service_charge numeric NOT NULL DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL, -- 'cash', 'card', 'upi'
  payment_status text NOT NULL DEFAULT 'paid',
  items jsonb NOT NULL,
  customer_name text,
  customer_phone text,
  notes text,
  printed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Create unique constraint for invoice numbers per restaurant
CREATE UNIQUE INDEX idx_invoices_number ON public.invoices(restaurant_id, invoice_number);

-- Enable RLS on new tables
ALTER TABLE public.printer_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies for printer_queue
CREATE POLICY "Restaurant staff can view printer queue"
ON public.printer_queue FOR SELECT
USING (restaurant_id = get_user_restaurant_id(auth.uid()));

CREATE POLICY "Restaurant staff can insert to printer queue"
ON public.printer_queue FOR INSERT
WITH CHECK (restaurant_id = get_user_restaurant_id(auth.uid()));

CREATE POLICY "Restaurant staff can update printer queue"
ON public.printer_queue FOR UPDATE
USING (restaurant_id = get_user_restaurant_id(auth.uid()));

CREATE POLICY "Restaurant staff can delete from printer queue"
ON public.printer_queue FOR DELETE
USING (restaurant_id = get_user_restaurant_id(auth.uid()));

-- RLS policies for invoices
CREATE POLICY "Restaurant staff can view invoices"
ON public.invoices FOR SELECT
USING (restaurant_id = get_user_restaurant_id(auth.uid()));

CREATE POLICY "Restaurant staff can create invoices"
ON public.invoices FOR INSERT
WITH CHECK (restaurant_id = get_user_restaurant_id(auth.uid()));

CREATE POLICY "Restaurant staff can update invoices"
ON public.invoices FOR UPDATE
USING (restaurant_id = get_user_restaurant_id(auth.uid()));

-- Add updated_at trigger for printer_queue
CREATE TRIGGER update_printer_queue_updated_at
BEFORE UPDATE ON public.printer_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.printer_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;