-- Add seat_session_id and token_no to orders table for session isolation and realtime order tracking
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS seat_session_id UUID REFERENCES public.seat_occupancy(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS token_no TEXT;

-- Create indices for realtime queries and seat session isolation
CREATE INDEX IF NOT EXISTS idx_orders_seat_session_id ON public.orders(seat_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_token_no ON public.orders(token_no);

-- Ensure orders is published in realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
