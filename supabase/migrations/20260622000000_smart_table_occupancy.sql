-- Create seat_occupancy table
CREATE TABLE IF NOT EXISTS public.seat_occupancy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
  table_session_id UUID REFERENCES public.table_sessions(id) ON DELETE CASCADE NOT NULL,
  seat_number INT NOT NULL,
  status TEXT DEFAULT 'occupied' CHECK (status IN ('occupied', 'available')),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(table_session_id, seat_number)
);

-- Add seat_number to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seat_number INT;

-- Enable RLS on seat_occupancy
ALTER TABLE public.seat_occupancy ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seat_occupancy
CREATE POLICY "Anyone can create seat occupancy"
ON public.seat_occupancy
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view seat occupancy"
ON public.seat_occupancy
FOR SELECT
USING (true);

CREATE POLICY "Restaurant staff can update seat occupancy"
ON public.seat_occupancy
FOR UPDATE
USING (restaurant_id = get_user_restaurant_id(auth.uid()) OR (auth.uid() IS NULL AND restaurant_id = '00000000-0000-0000-0000-000000000001'::uuid));

-- Ensure realtime is enabled
ALTER PUBLICATION supabase_realtime ADD TABLE public.seat_occupancy;

-- Add trigger for updated_at
CREATE TRIGGER update_seat_occupancy_updated_at 
BEFORE UPDATE ON public.seat_occupancy 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
