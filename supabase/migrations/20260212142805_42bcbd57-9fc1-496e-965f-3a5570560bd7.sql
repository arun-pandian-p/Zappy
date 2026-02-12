
-- Create offers table for sliding food offers system
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  discount_text TEXT,
  linked_menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Public can view active offers for active restaurants
CREATE POLICY "Public can view active offers"
ON public.offers
FOR SELECT
USING (
  is_active = true
  AND (start_date IS NULL OR start_date <= now())
  AND (end_date IS NULL OR end_date >= now())
  AND EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = offers.restaurant_id AND r.is_active = true
  )
);

-- Restaurant staff can manage their own offers
CREATE POLICY "Restaurant staff can manage offers"
ON public.offers
FOR ALL
USING (restaurant_id = get_user_restaurant_id(auth.uid()))
WITH CHECK (restaurant_id = get_user_restaurant_id(auth.uid()));

-- Super admins can manage all offers
CREATE POLICY "Super admins can manage all offers"
ON public.offers
FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;
