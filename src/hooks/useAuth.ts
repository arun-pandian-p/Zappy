import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  restaurantId: string | null;
  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    restaurantId: null,
    loading: true,
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Fetch user role using setTimeout to avoid Supabase deadlock
          setTimeout(async () => {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role, restaurant_id')
              .eq('user_id', session.user.id)
              .single();

            setAuthState({
              user: session.user,
              session,
              role: roleData?.role || null,
              restaurantId: roleData?.restaurant_id || null,
              loading: false,
            });
          }, 0);
        } else {
          setAuthState({
            user: null,
            session: null,
            role: null,
            restaurantId: null,
            loading: false,
          });
        }
      }
    );

    // THEN get initial session
    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return;
      }
      const session = data.session;
      if (session?.user) {
        supabase
          .from('user_roles')
          .select('role, restaurant_id')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data: roleData }) => {
            setAuthState({
              user: session.user,
              session,
              role: roleData?.role || null,
              restaurantId: roleData?.restaurant_id || null,
              loading: false,
            });
          });
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const getRouteForRole = (role: AppRole | null): string => {
    switch (role) {
      case 'super_admin':
        return '/super-admin';
      case 'restaurant_admin':
        return '/admin';
      case 'kitchen_staff':
        return '/kitchen';
      case 'waiter_staff':
        return '/waiter';
      case 'billing_staff':
        return '/billing';
      default:
        return '/roles';
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    getRouteForRole,
  };
};
