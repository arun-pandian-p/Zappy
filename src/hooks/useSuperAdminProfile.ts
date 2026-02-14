import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useSuperAdminProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['super-admin-profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('super_admin_profile')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const upsertProfile = useMutation({
    mutationFn: async (updates: { display_name?: string; avatar_url?: string; phone?: string; theme_preference?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const existing = query.data;
      if (existing) {
        const { data, error } = await supabase
          .from('super_admin_profile')
          .update(updates)
          .eq('user_id', user.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('super_admin_profile')
          .insert({ user_id: user.id, ...updates })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-profile'] });
    },
  });

  return { profile: query.data, isLoading: query.isLoading, upsertProfile };
};
