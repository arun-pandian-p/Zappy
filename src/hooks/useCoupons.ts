import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Coupon = Tables<"coupons">;
export type CouponInsert = TablesInsert<"coupons">;
export type CouponUpdate = TablesUpdate<"coupons">;

export function useCoupons(restaurantId?: string) {
  return useQuery({
    queryKey: ["coupons", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Coupon[];
    },
    enabled: !!restaurantId,
  });
}

export function useActiveCoupons(restaurantId?: string) {
  return useQuery({
    queryKey: ["coupons", "active", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("is_active", true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`expires_at.is.null,expires_at.gte.${now}`);

      if (error) throw error;
      return data as Coupon[];
    },
    enabled: !!restaurantId,
  });
}

export function useValidateCoupon(restaurantId?: string) {
  return useMutation({
    mutationFn: async ({ code, orderTotal }: { code: string; orderTotal: number }) => {
      if (!restaurantId) throw new Error("Restaurant ID required");

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !data) throw new Error("Invalid coupon code");

      const coupon = data as Coupon;

      // Check dates
      if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
        throw new Error("Coupon is not yet active");
      }
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        throw new Error("Coupon has expired");
      }

      // Check usage limit
      if (coupon.usage_limit && (coupon.usage_count || 0) >= coupon.usage_limit) {
        throw new Error("Coupon usage limit reached");
      }

      // Check minimum order amount
      if (coupon.min_order_amount && orderTotal < Number(coupon.min_order_amount)) {
        throw new Error(`Minimum order amount is ${coupon.min_order_amount}`);
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discount_type === "percentage") {
        discount = orderTotal * (Number(coupon.discount_value) / 100);
        if (coupon.max_discount_amount) {
          discount = Math.min(discount, Number(coupon.max_discount_amount));
        }
      } else {
        discount = Number(coupon.discount_value);
      }

      return { coupon, discount };
    },
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (coupon: CouponInsert) => {
      const { data, error } = await supabase
        .from("coupons")
        .insert({ ...coupon, code: coupon.code.toUpperCase() })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["coupons", variables.restaurant_id] });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CouponUpdate }) => {
      const { data, error } = await supabase
        .from("coupons")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("coupons")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}

export function useIncrementCouponUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (couponId: string) => {
      const { data: current, error: fetchError } = await supabase
        .from("coupons")
        .select("usage_count")
        .eq("id", couponId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from("coupons")
        .update({ usage_count: (current?.usage_count || 0) + 1 })
        .eq("id", couponId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}
