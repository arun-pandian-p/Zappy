import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EnterprisePromotion } from "@/services/promotions/types";

// Helper to gracefully fallback to old "offers" table if the new "enterprise_promotions" doesn't exist yet
async function fetchPromotions(restaurantId: string): Promise<EnterprisePromotion[]> {
  try {
    const { data, error } = await supabase
      .from("enterprise_promotions" as any)
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("priority", { ascending: true });

    if (error) {
      if (error.code === '42P01' || error.message?.includes('Could not find the table')) { // table does not exist
        console.warn('enterprise_promotions table not found, falling back to offers');
        return fetchLegacyOffers(restaurantId);
      }
      throw error;
    }
    return (data || []) as EnterprisePromotion[];
  } catch (err: any) {
    if (err.code === '42P01' || err.message?.includes('Could not find the table')) {
      return fetchLegacyOffers(restaurantId);
    }
    throw err;
  }
}

async function fetchLegacyOffers(restaurantId: string): Promise<EnterprisePromotion[]> {
  const { data, error } = await supabase
    .from("offers" as any)
    .select("*")
    .eq("restaurant_id", restaurantId);
  
  if (error) throw error;
  
  // Transform legacy offers to enterprise format
  return (data || []).map((o: any) => ({
    id: o.id,
    restaurant_id: o.restaurant_id,
    title: o.title,
    description: o.description,
    image_url: o.image_url,
    banner_url: null,
    promo_code: null,
    origin: "restaurant",
    status: o.is_active ? "active" : "paused",
    priority: o.sort_order || 10,
    type: "percentage",
    discount_value: parseInt(o.discount_text) || 0, // crude extraction for demo
    max_discount: null,
    min_order_value: 0,
    target_menu_item_ids: o.linked_menu_item_id ? [o.linked_menu_item_id] : null,
    target_category_ids: null,
    new_users_only: false,
    valid_days: null,
    valid_hours_start: null,
    valid_hours_end: null,
    start_date: o.start_date,
    end_date: o.end_date,
    usage_count: 0,
    max_usage: null,
    max_usage_per_user: 1,
    rejection_reason: null,
    approved_by: null,
    approved_at: null,
    created_at: o.created_at || new Date().toISOString(),
    updated_at: o.updated_at || new Date().toISOString()
  }));
}

export function useEnterprisePromotions(restaurantId: string) {
  return useQuery({
    queryKey: ["enterprise_promotions", restaurantId],
    queryFn: () => fetchPromotions(restaurantId),
    enabled: !!restaurantId,
  });
}

export function useActiveEnterprisePromotions(restaurantId: string) {
  return useQuery({
    queryKey: ["enterprise_promotions", restaurantId, "active"],
    queryFn: async () => {
      const all = await fetchPromotions(restaurantId);
      const now = new Date().toISOString();
      return all.filter(p => p.status === 'active' && p.start_date <= now && p.end_date >= now);
    },
    enabled: !!restaurantId,
  });
}

// Add mutation hooks below similarly, handling the dual-table logic...
export function useCreateEnterprisePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (promo: Partial<EnterprisePromotion>) => {
      try {
        const { data, error } = await supabase
          .from("enterprise_promotions" as any)
          .insert(promo as any)
          .select()
          .single();
        if (error) throw error;
        return data as EnterprisePromotion;
      } catch (err: any) {
        if (err.code === '42P01' || err.message?.includes('Could not find the table')) {
          // Fallback map to old table
          const legacy = {
            restaurant_id: promo.restaurant_id,
            title: promo.title,
            description: promo.description,
            image_url: promo.image_url,
            discount_text: `${promo.discount_value}${promo.type === 'percentage' ? '%' : ''} OFF`,
            start_date: promo.start_date,
            end_date: promo.end_date,
            is_active: promo.status === 'active',
          };
          const { data, error } = await supabase.from("offers" as any).insert(legacy).select().single();
          if (error) throw error;
          return data;
        }
        throw err;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["enterprise_promotions", variables.restaurant_id] });
      queryClient.invalidateQueries({ queryKey: ["offers", variables.restaurant_id] });
    },
  });
}

export function useUpdateEnterprisePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, restaurantId, updates }: { id: string; restaurantId: string; updates: Partial<EnterprisePromotion> }) => {
      try {
        const { data, error } = await supabase
          .from("enterprise_promotions" as any)
          .update(updates as any)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data as EnterprisePromotion;
      } catch (err: any) {
        if (err.code === '42P01' || err.message?.includes('Could not find the table')) {
           // map back
           const legacyUpdates: any = {};
           if (updates.status !== undefined) legacyUpdates.is_active = updates.status === 'active';
           if (updates.title !== undefined) legacyUpdates.title = updates.title;
           if (updates.description !== undefined) legacyUpdates.description = updates.description;
           if (updates.image_url !== undefined) legacyUpdates.image_url = updates.image_url;
           
           const { data, error } = await supabase.from("offers" as any).update(legacyUpdates).eq("id", id).select().single();
           if (error) throw error;
           return data;
        }
        throw err;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["enterprise_promotions", variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["offers", variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["offers-count-by-restaurant"] });
    },
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, restaurantId }: { id: string; restaurantId: string }) => {
      try {
        const { error } = await supabase
          .from("enterprise_promotions" as any)
          .delete()
          .eq("id", id);
        if (error) throw error;
      } catch (err: any) {
        if (err.code === '42P01' || err.message?.includes('Could not find the table')) {
          const { error } = await supabase.from("offers" as any).delete().eq("id", id);
          if (error) throw error;
        }
        throw err;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["enterprise_promotions", variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["offers", variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["offers-count-by-restaurant"] });
    },
  });
}
