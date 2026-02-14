import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  restaurant_id: string;
  restaurant_name: string;
  logo_url: string | null;
  subscription_tier: string | null;
  total_revenue: number;
  order_count: number;
  avg_order_value: number;
}

export const useLeaderboard = (dateRange?: { from: string; to: string }) => {
  return useQuery({
    queryKey: ['leaderboard', dateRange],
    queryFn: async () => {
      // Get all restaurants
      const { data: restaurants, error: rErr } = await supabase
        .from('restaurants')
        .select('id, name, logo_url, subscription_tier')
        .eq('is_active', true);
      if (rErr) throw rErr;

      // Get order totals grouped by restaurant
      let ordersQuery = supabase
        .from('orders')
        .select('restaurant_id, total_amount, created_at');
      
      if (dateRange?.from) {
        ordersQuery = ordersQuery.gte('created_at', dateRange.from);
      }
      if (dateRange?.to) {
        ordersQuery = ordersQuery.lte('created_at', dateRange.to);
      }

      const { data: orders, error: oErr } = await ordersQuery;
      if (oErr) throw oErr;

      // Aggregate
      const aggregated = new Map<string, { revenue: number; count: number }>();
      for (const order of orders || []) {
        const existing = aggregated.get(order.restaurant_id) || { revenue: 0, count: 0 };
        existing.revenue += Number(order.total_amount || 0);
        existing.count += 1;
        aggregated.set(order.restaurant_id, existing);
      }

      const entries: LeaderboardEntry[] = (restaurants || []).map((r) => {
        const agg = aggregated.get(r.id) || { revenue: 0, count: 0 };
        return {
          restaurant_id: r.id,
          restaurant_name: r.name,
          logo_url: r.logo_url,
          subscription_tier: r.subscription_tier,
          total_revenue: agg.revenue,
          order_count: agg.count,
          avg_order_value: agg.count > 0 ? agg.revenue / agg.count : 0,
        };
      });

      entries.sort((a, b) => b.total_revenue - a.total_revenue);
      return entries;
    },
  });
};
