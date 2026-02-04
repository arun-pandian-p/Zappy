import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Feedback = Tables<"feedback">;
export type FeedbackInsert = TablesInsert<"feedback">;

export interface FeedbackWithDetails extends Feedback {
  table?: Pick<Tables<"tables">, "id" | "table_number"> | null;
  order?: Pick<Tables<"orders">, "id" | "order_number"> | null;
}

export function useFeedback(restaurantId?: string) {
  return useQuery({
    queryKey: ["feedback", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const { data, error } = await supabase
        .from("feedback")
        .select(`
          *,
          table:tables(id, table_number),
          order:orders(id, order_number)
        `)
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FeedbackWithDetails[];
    },
    enabled: !!restaurantId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useFeedbackStats(restaurantId?: string) {
  return useQuery({
    queryKey: ["feedback", "stats", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return null;
      
      const { data, error } = await supabase
        .from("feedback")
        .select("rating, redirected_to_google")
        .eq("restaurant_id", restaurantId);

      if (error) throw error;

      const total = data.length;
      const avgRating = total > 0 
        ? data.reduce((sum, f) => sum + f.rating, 0) / total 
        : 0;
      const googleRedirects = data.filter(f => f.redirected_to_google).length;
      const ratingDistribution = {
        1: data.filter(f => f.rating === 1).length,
        2: data.filter(f => f.rating === 2).length,
        3: data.filter(f => f.rating === 3).length,
        4: data.filter(f => f.rating === 4).length,
        5: data.filter(f => f.rating === 5).length,
      };

      return {
        total,
        avgRating: Math.round(avgRating * 10) / 10,
        googleRedirects,
        ratingDistribution,
      };
    },
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedback: FeedbackInsert) => {
      const { data, error } = await supabase
        .from("feedback")
        .insert(feedback)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["feedback", data.restaurant_id] });
      queryClient.invalidateQueries({ queryKey: ["feedback", "stats", data.restaurant_id] });
    },
  });
}

export function useRecentFeedback(restaurantId?: string, limit = 10) {
  return useQuery({
    queryKey: ["feedback", "recent", restaurantId, limit],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const { data, error } = await supabase
        .from("feedback")
        .select(`
          *,
          table:tables(id, table_number),
          order:orders(id, order_number)
        `)
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as FeedbackWithDetails[];
    },
    enabled: !!restaurantId,
    staleTime: 60 * 1000,
  });
}
