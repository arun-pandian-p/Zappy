import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSuperAdminLogs = (search?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['superadmin-system-logs', search],
    queryFn: async () => {
      let q = supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (search) {
        q = q.or(`action.ilike.%${search}%,entity_type.ilike.%${search}%,actor_email.ilike.%${search}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    const channel = supabase
      .channel('system-logs-realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'system_logs'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['superadmin-system-logs'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return { logs: query.data || [], isLoading: query.isLoading, refetch: query.refetch };
};
