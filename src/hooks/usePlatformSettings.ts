import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePlatformSettings = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { data: existing } = await supabase
        .from('platform_settings')
        .select('id')
        .limit(1)
        .single();
      if (!existing) throw new Error('No settings found');

      const { data, error } = await supabase
        .from('platform_settings')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
    },
  });

  return { settings: query.data, isLoading: query.isLoading, updateSettings: updateMutation };
};
