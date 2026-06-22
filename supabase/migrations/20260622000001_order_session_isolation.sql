-- Add table_session_id to orders
ALTER TABLE public.orders 
ADD COLUMN table_session_id UUID REFERENCES public.table_sessions(id) ON DELETE SET NULL;

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_orders_table_session_id ON public.orders(table_session_id);
