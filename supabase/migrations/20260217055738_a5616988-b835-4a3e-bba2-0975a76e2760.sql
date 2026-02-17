
-- Phase 1: Variants & Add-ons System

-- Variant groups linked to menu items
CREATE TABLE public.variant_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  min_select INTEGER NOT NULL DEFAULT 1,
  max_select INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Variant options within groups
CREATE TABLE public.variant_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_group_id UUID NOT NULL REFERENCES public.variant_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_modifier NUMERIC NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Addon groups (restaurant-level, reusable across items)
CREATE TABLE public.addon_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_select INTEGER NOT NULL DEFAULT 0,
  max_select INTEGER NOT NULL DEFAULT 5,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Addon options within groups
CREATE TABLE public.addon_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  addon_group_id UUID NOT NULL REFERENCES public.addon_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link menu items to addon groups
ALTER TABLE public.menu_items ADD COLUMN addon_group_ids TEXT[] DEFAULT '{}';

-- Store selected variants/addons on order items
ALTER TABLE public.order_items ADD COLUMN selected_variants JSONB DEFAULT '[]';
ALTER TABLE public.order_items ADD COLUMN selected_addons JSONB DEFAULT '[]';

-- Phase 2: Order cancel with reason
ALTER TABLE public.orders ADD COLUMN cancel_reason TEXT;
ALTER TABLE public.orders ADD COLUMN cancelled_at TIMESTAMPTZ;

-- Phase 4: Inventory tables
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  current_stock NUMERIC NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.recipe_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity_used NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for variant_groups
ALTER TABLE public.variant_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view variant groups" ON public.variant_groups
  FOR SELECT USING (true);

CREATE POLICY "Restaurant staff can manage variant groups" ON public.variant_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.menu_items mi
      WHERE mi.id = variant_groups.menu_item_id
      AND mi.restaurant_id = get_user_restaurant_id(auth.uid())
    )
  );

-- RLS for variant_options
ALTER TABLE public.variant_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view variant options" ON public.variant_options
  FOR SELECT USING (true);

CREATE POLICY "Restaurant staff can manage variant options" ON public.variant_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.variant_groups vg
      JOIN public.menu_items mi ON mi.id = vg.menu_item_id
      WHERE vg.id = variant_options.variant_group_id
      AND mi.restaurant_id = get_user_restaurant_id(auth.uid())
    )
  );

-- RLS for addon_groups
ALTER TABLE public.addon_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view addon groups" ON public.addon_groups
  FOR SELECT USING (true);

CREATE POLICY "Restaurant staff can manage addon groups" ON public.addon_groups
  FOR ALL USING (restaurant_id = get_user_restaurant_id(auth.uid()));

-- RLS for addon_options
ALTER TABLE public.addon_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view addon options" ON public.addon_options
  FOR SELECT USING (true);

CREATE POLICY "Restaurant staff can manage addon options" ON public.addon_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.addon_groups ag
      WHERE ag.id = addon_options.addon_group_id
      AND ag.restaurant_id = get_user_restaurant_id(auth.uid())
    )
  );

-- RLS for inventory_items
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant staff can manage inventory" ON public.inventory_items
  FOR ALL USING (restaurant_id = get_user_restaurant_id(auth.uid()));

-- RLS for recipe_mappings
ALTER TABLE public.recipe_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant staff can manage recipes" ON public.recipe_mappings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.menu_items mi
      WHERE mi.id = recipe_mappings.menu_item_id
      AND mi.restaurant_id = get_user_restaurant_id(auth.uid())
    )
  );

-- Indexes
CREATE INDEX idx_variant_groups_menu_item ON public.variant_groups(menu_item_id);
CREATE INDEX idx_variant_options_group ON public.variant_options(variant_group_id);
CREATE INDEX idx_addon_groups_restaurant ON public.addon_groups(restaurant_id);
CREATE INDEX idx_addon_options_group ON public.addon_options(addon_group_id);
CREATE INDEX idx_inventory_restaurant ON public.inventory_items(restaurant_id);
CREATE INDEX idx_recipe_menu_item ON public.recipe_mappings(menu_item_id);
