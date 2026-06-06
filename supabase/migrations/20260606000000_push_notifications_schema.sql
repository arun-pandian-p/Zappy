-- Create notification tables and triggers for Zappy QR Menu Push Notification System

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
