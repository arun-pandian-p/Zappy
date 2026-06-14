import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSystemLogs = (restaurantId: string, search?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['system-logs', restaurantId, search],
    queryFn: async () => {
      if (!restaurantId) return [];
      let q = supabase
        .from('audit_logs')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (search) {
        q = q.or(`action.ilike.%${search}%,table_name.ilike.%${search}%,ip_address.ilike.%${search}%,device.ilike.%${search}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId
  });

  useEffect(() => {
    if (!restaurantId) return;
    const channel = supabase
      .channel(`audit-logs-realtime-${restaurantId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'audit_logs',
        filter: `restaurant_id=eq.${restaurantId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['system-logs', restaurantId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurantId, queryClient]);

  return { logs: query.data || [], isLoading: query.isLoading, refetch: query.refetch };
};
