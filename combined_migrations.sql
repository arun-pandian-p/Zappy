-- ==========================================
-- 1. PUSH NOTIFICATIONS SCHEMA (20260606000000)
-- ==========================================

-- 1) Create Notification Subscriptions table
CREATE TABLE IF NOT EXISTS public.notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  endpoint TEXT UNIQUE NOT NULL,
  keys JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscriptions Policies
DROP POLICY IF EXISTS "Staff can view subscriptions in their restaurant" ON public.notification_subscriptions;
CREATE POLICY "Staff can view subscriptions in their restaurant" ON public.notification_subscriptions
  FOR SELECT TO authenticated
  USING (restaurant_id = public.get_user_restaurant_id(auth.uid()));

DROP POLICY IF EXISTS "Anyone can create subscriptions" ON public.notification_subscriptions;
CREATE POLICY "Anyone can create subscriptions" ON public.notification_subscriptions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete subscriptions" ON public.notification_subscriptions;
CREATE POLICY "Anyone can delete subscriptions" ON public.notification_subscriptions
  FOR DELETE USING (true);


-- 2) Create Notification Preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  channels JSONB DEFAULT '{"push": true, "sms": false, "email": true}'::jsonb,
  categories JSONB DEFAULT '{"order_updates": true, "waiter_calls": true}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, restaurant_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Preferences Policies
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage their own preferences" ON public.notification_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- 3) Create Notification Queue table
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  next_retry_at TIMESTAMPTZ DEFAULT now(),
  error_log TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Queue Policies
DROP POLICY IF EXISTS "Staff can view notification queue" ON public.notification_queue;
CREATE POLICY "Staff can view notification queue" ON public.notification_queue
  FOR SELECT TO authenticated
  USING (restaurant_id = public.get_user_restaurant_id(auth.uid()));


-- 4) Create Notification Logs table
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES public.notification_queue(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES public.notification_subscriptions(id) ON DELETE CASCADE NOT NULL,
  delivered_at TIMESTAMPTZ DEFAULT now(),
  response_status INT
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Logs Policies
DROP POLICY IF EXISTS "Staff can view notification logs" ON public.notification_logs;
CREATE POLICY "Staff can view notification logs" ON public.notification_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.notification_subscriptions s
    WHERE s.id = subscription_id
    AND s.restaurant_id = public.get_user_restaurant_id(auth.uid())
  ));


-- 5) Trigger Function for Orders Status Update
CREATE OR REPLACE FUNCTION public.queue_order_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_title text;
  v_message text;
BEGIN
  -- Only trigger on status changes or creation
  IF (TG_OP = 'UPDATE' AND OLD.status = NEW.status) THEN
    RETURN NEW;
  END IF;

  -- Build title and message based on new status
  CASE NEW.status
    WHEN 'confirmed' THEN
      v_title := 'Order Confirmed';
      v_message := 'Your order has been confirmed by the restaurant.';
    WHEN 'preparing' THEN
      v_title := 'Preparing Your Food';
      v_message := 'The chef is now preparing your delicious meal.';
    WHEN 'ready' THEN
      v_title := 'Order Ready';
      v_message := 'Your order is ready to be served!';
    WHEN 'served' THEN
      v_title := 'Order Served';
      v_message := 'Enjoy your meal!';
    WHEN 'completed' THEN
      v_title := 'Order Completed';
      v_message := 'Thank you for dining with us!';
    WHEN 'cancelled' THEN
      v_title := 'Order Cancelled';
      v_message := 'Your order has been cancelled.';
    ELSE
      v_title := 'Order Update';
      v_message := 'Your order status has changed to: ' || NEW.status;
  END CASE;

  -- Insert notification in queue targeting the specific table
  INSERT INTO public.notification_queue (
    restaurant_id,
    target_table_id,
    title,
    message,
    payload
  ) VALUES (
    NEW.restaurant_id,
    NEW.table_id,
    v_title,
    v_message,
    jsonb_build_object(
      'order_id', NEW.id,
      'status', NEW.status,
      'table_id', NEW.table_id,
      'type', 'order_update'
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for Orders
CREATE OR REPLACE TRIGGER trigger_order_status_notification
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.queue_order_status_notification();


-- 6) Trigger Function for Waiter Calls
CREATE OR REPLACE FUNCTION public.queue_waiter_call_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_table_number text;
BEGIN
  -- Only alert on new pending calls
  IF (NEW.status != 'pending') THEN
    RETURN NEW;
  END IF;

  -- Fetch table number
  SELECT table_number INTO v_table_number
  FROM public.tables
  WHERE id = NEW.table_id;

  -- Insert notification in queue (with target_user_id NULL, targets all staff of that restaurant)
  INSERT INTO public.notification_queue (
    restaurant_id,
    title,
    message,
    payload
  ) VALUES (
    NEW.restaurant_id,
    '🔔 Waiter Requested',
    COALESCE(NEW.reason, 'Assistance requested') || ' at Table ' || COALESCE(v_table_number, 'Unknown'),
    jsonb_build_object(
      'waiter_call_id', NEW.id,
      'table_id', NEW.table_id,
      'type', 'waiter_call'
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for Waiter Calls
CREATE OR REPLACE TRIGGER trigger_waiter_call_notification
AFTER INSERT ON public.waiter_calls
FOR EACH ROW EXECUTE FUNCTION public.queue_waiter_call_notification();



-- ==========================================
-- 2. BILLING ENGINE & KDS REMEDIATION (20260606034123)
-- ==========================================

-- 1. Drop trigger and function that depend on orders status column
DROP TRIGGER IF EXISTS trigger_order_status_notification ON public.orders;
DROP FUNCTION IF EXISTS public.queue_order_status_notification();

-- 2. Recreate type by renaming, creating new type, altering columns, and dropping old type
ALTER TYPE public.order_status RENAME TO order_status_old;

CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'served', 'billed', 'completed', 'cancelled');

ALTER TABLE public.orders ALTER COLUMN status TYPE public.order_status USING status::text::public.order_status;
ALTER TABLE public.order_items ALTER COLUMN status TYPE public.order_status USING status::text::public.order_status;

DROP TYPE public.order_status_old;

-- 3. Recreate the trigger function (including 'billed' case!) and the trigger
CREATE OR REPLACE FUNCTION public.queue_order_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_title text;
  v_message text;
BEGIN
  -- Only trigger on status changes or creation
  IF (TG_OP = 'UPDATE' AND OLD.status = NEW.status) THEN
    RETURN NEW;
  END IF;

  -- Build title and message based on new status
  CASE NEW.status
    WHEN 'confirmed' THEN
      v_title := 'Order Confirmed';
      v_message := 'Your order has been confirmed by the restaurant.';
    WHEN 'preparing' THEN
      v_title := 'Preparing Your Food';
      v_message := 'The chef is now preparing your delicious meal.';
    WHEN 'ready' THEN
      v_title := 'Order Ready';
      v_message := 'Your order is ready to be served!';
    WHEN 'served' THEN
      v_title := 'Order Served';
      v_message := 'Enjoy your meal!';
    WHEN 'billed' THEN
      v_title := 'Order Billed';
      v_message := 'Your bill is ready. Please proceed to payment.';
    WHEN 'completed' THEN
      v_title := 'Order Completed';
      v_message := 'Thank you for dining with us!';
    WHEN 'cancelled' THEN
      v_title := 'Order Cancelled';
      v_message := 'Your order has been cancelled.';
    ELSE
      v_title := 'Order Update';
      v_message := 'Your order status has changed to: ' || NEW.status;
  END CASE;

  -- Insert notification in queue targeting the specific table
  INSERT INTO public.notification_queue (
    restaurant_id,
    target_table_id,
    title,
    message,
    payload
  ) VALUES (
    NEW.restaurant_id,
    NEW.table_id,
    v_title,
    v_message,
    jsonb_build_object(
      'order_id', NEW.id,
      'status', NEW.status,
      'table_id', NEW.table_id,
      'type', 'order_update'
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_order_status_notification
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.queue_order_status_notification();

-- 4. Concurrency columns in orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS locked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS locked_at timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS version integer DEFAULT 1 NOT NULL;

-- 5. Unique constraint on invoices to prevent duplicate billing
ALTER TABLE public.invoices ADD CONSTRAINT unique_order_invoice UNIQUE (order_id);

-- 6. Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Select policy
DROP POLICY IF EXISTS "Restaurant staff can view audit logs" ON public.audit_logs;
CREATE POLICY "Restaurant staff can view audit logs" ON public.audit_logs
  FOR SELECT USING (restaurant_id = public.get_user_restaurant_id(auth.uid()));

-- 7. Multi-kitchen routing columns
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS kitchen_station text DEFAULT 'kitchen' NOT NULL;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS kitchen_station text DEFAULT 'kitchen' NOT NULL;

-- 8. QR session token and scan tracking
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS session_token uuid DEFAULT gen_random_uuid() NOT NULL;

CREATE TABLE IF NOT EXISTS public.qr_scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id uuid REFERENCES public.tables(id) ON DELETE SET NULL,
  scanned_at timestamp with time zone DEFAULT now(),
  user_agent text,
  ip_hash text
);

-- Enable RLS on qr_scan_logs
ALTER TABLE public.qr_scan_logs ENABLE ROW LEVEL SECURITY;

-- Select policy
DROP POLICY IF EXISTS "Restaurant staff can view QR scan logs" ON public.qr_scan_logs;
CREATE POLICY "Restaurant staff can view QR scan logs" ON public.qr_scan_logs
  FOR SELECT USING (restaurant_id = public.get_user_restaurant_id(auth.uid()));

-- Insert policy
DROP POLICY IF EXISTS "Anyone can insert QR scan logs" ON public.qr_scan_logs;
CREATE POLICY "Anyone can insert QR scan logs" ON public.qr_scan_logs
  FOR INSERT WITH CHECK (true);

-- 9. High-performance indexes
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON public.orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_restaurant_created ON public.invoices(restaurant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_table_scanned ON public.qr_scan_logs(table_id, scanned_at);

-- 10. Atomic complete_billing_transaction Postgres RPC function
CREATE OR REPLACE FUNCTION public.complete_billing_transaction(
  p_order_id uuid,
  p_payment_method text,
  p_discount_amount numeric,
  p_total_amount numeric,
  p_customer_name text DEFAULT NULL,
  p_customer_phone text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_invoice_number text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_restaurant_id uuid;
  v_subtotal numeric;
  v_tax_amount numeric;
  v_service_charge numeric;
  v_invoice_id uuid;
  v_invoice_number text;
  v_order_items jsonb;
  v_status order_status;
  v_is_locked boolean;
  v_old_values jsonb;
  v_new_values jsonb;
BEGIN
  -- 1. Check order locking and details
  SELECT restaurant_id, subtotal, tax_amount, service_charge, status, is_locked, 
         jsonb_build_object('status', status, 'payment_status', payment_status)
    INTO v_restaurant_id, v_subtotal, v_tax_amount, v_service_charge, v_status, v_is_locked, v_old_values
    FROM public.orders
    WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_status = 'completed' OR v_status = 'cancelled' THEN
    RAISE EXCEPTION 'Order is already closed or cancelled';
  END IF;

  IF v_is_locked THEN
    RAISE EXCEPTION 'Order is currently locked by another operation';
  END IF;

  -- 2. Check if invoice already exists (duplicate billing prevention)
  IF EXISTS (SELECT 1 FROM public.invoices WHERE order_id = p_order_id) THEN
    RAISE EXCEPTION 'Invoice already exists for this order';
  END IF;

  -- 3. Lock the order row for update
  UPDATE public.orders
    SET is_locked = true, locked_at = now(), locked_by = p_user_id
    WHERE id = p_order_id;

  -- 4. Get order items formatted as JSON
  SELECT json_agg(json_build_object(
    'id', id,
    'name', name,
    'quantity', quantity,
    'price', price,
    'total', price * quantity
  ))::jsonb
    INTO v_order_items
    FROM public.order_items
    WHERE order_id = p_order_id;

  -- 5. Prepare invoice number if not provided
  IF p_invoice_number IS NULL OR p_invoice_number = '' THEN
    v_invoice_number := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || substring(p_order_id::text from 1 for 6);
  ELSE
    v_invoice_number := p_invoice_number;
  END IF;

  -- 6. Insert the invoice
  INSERT INTO public.invoices (
    restaurant_id,
    order_id,
    invoice_number,
    subtotal,
    tax_amount,
    service_charge,
    discount_amount,
    total_amount,
    payment_method,
    payment_status,
    items,
    customer_name,
    customer_phone,
    notes,
    printed
  ) VALUES (
    v_restaurant_id,
    p_order_id,
    v_invoice_number,
    v_subtotal,
    v_tax_amount,
    v_service_charge,
    p_discount_amount,
    p_total_amount,
    p_payment_method,
    'paid',
    COALESCE(v_order_items, '[]'::jsonb),
    p_customer_name,
    p_customer_phone,
    p_notes,
    false
  ) RETURNING id INTO v_invoice_id;

  -- 7. Update the order to completed and release lock
  UPDATE public.orders
    SET status = 'completed'::order_status,
        payment_status = 'paid'::payment_status,
        payment_method = p_payment_method,
        is_locked = false,
        locked_at = NULL,
        locked_by = NULL,
        version = version + 1
    WHERE id = p_order_id;

  v_new_values := jsonb_build_object('status', 'completed', 'payment_status', 'paid', 'payment_method', p_payment_method);

  -- 8. Write audit logs
  INSERT INTO public.audit_logs (
    restaurant_id,
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    v_restaurant_id,
    p_user_id,
    'complete_billing',
    'orders',
    p_order_id,
    v_old_values,
    v_new_values
  );

  RETURN v_invoice_id;
EXCEPTION WHEN OTHERS THEN
  -- Make sure order is unlocked in case of rollback/failure
  UPDATE public.orders
    SET is_locked = false, locked_at = NULL, locked_by = NULL
    WHERE id = p_order_id;
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
