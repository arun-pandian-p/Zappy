import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LandingSection {
  id: string;
  section_key: string;
  content_json: Record<string, any>;
  is_visible: boolean;
  display_order: number;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useLandingCMS = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['landing-cms-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as LandingSection[];
    },
  });

  const updateSection = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<LandingSection> }) => {
      const { data, error } = await supabase
        .from('landing_page_sections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-cms-sections'] });
    },
  });

  return { sections: query.data || [], isLoading: query.isLoading, updateSection };
};
