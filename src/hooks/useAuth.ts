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
  originalRestaurantId: string | null;
  loading: boolean;
}

const clearSupabaseAuthState = () => {
  localStorage.removeItem('impersonated_restaurant_id');

  const authKeys = Object.keys(localStorage).filter(
    (key) => key.startsWith('sb-') || key.includes('supabase')
  );

  authKeys.forEach((key) => localStorage.removeItem(key));
};

const isRefreshTokenError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || '');
  return (
    message.toLowerCase().includes('refresh token') ||
    message.toLowerCase().includes('invalid refresh token') ||
    message.toLowerCase().includes('token not found')
  );
};

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    restaurantId: null,
    originalRestaurantId: null,
    loading: true,
  });

  useEffect(() => {
    const handleUnload = () => {
      supabase.removeAllChannels();
    };
    window.addEventListener('beforeunload', handleUnload);

    const setLoggedOutState = () => {
      setAuthState({
        user: null,
        session: null,
        role: null,
        restaurantId: null,
        originalRestaurantId: null,
        loading: false,
      });
    };

    const loadSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.warn('Auth session recovery failed:', error.message);
          if (isRefreshTokenError(error)) {
            clearSupabaseAuthState();
          }
          setLoggedOutState();
          return;
        }

        const session = data.session;

        if (!session?.user) {
          setLoggedOutState();
          return;
        }

        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role, restaurant_id')
          .eq('user_id', session.user.id)
          .single();

        if (roleError) {
          console.warn('Failed to load user role during auth bootstrap:', roleError.message);
        }

        const impersonatedId = localStorage.getItem('impersonated_restaurant_id');
        const actualRestId = roleData?.restaurant_id || null;
        const restIdToUse = (roleData?.role === 'super_admin' && impersonatedId) ? impersonatedId : actualRestId;

        setAuthState({
          user: session.user,
          session,
          role: roleData?.role || null,
          restaurantId: restIdToUse,
          originalRestaurantId: actualRestId,
          loading: false,
        });
      } catch (error) {
        console.warn('Unexpected auth bootstrap failure:', error);
        if (isRefreshTokenError(error)) {
          clearSupabaseAuthState();
        }
        setLoggedOutState();
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setTimeout(async () => {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role, restaurant_id')
              .eq('user_id', session.user.id)
              .single();

            const impersonatedId = localStorage.getItem('impersonated_restaurant_id');
            const actualRestId = roleData?.restaurant_id || null;
            const restIdToUse = (roleData?.role === 'super_admin' && impersonatedId) ? impersonatedId : actualRestId;

            setAuthState({
              user: session.user,
              session,
              role: roleData?.role || null,
              restaurantId: restIdToUse,
              originalRestaurantId: actualRestId,
              loading: false,
            });
          }, 0);
        } else {
          setLoggedOutState();
        }
      }
    );

    loadSession();

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { data, error };
  };

  const signOut = async () => {
    clearSupabaseAuthState();
    try {
      await supabase.removeAllChannels();
    } catch (err) {
      console.warn('Failed to clean up channels on logout:', err);
    }
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.warn('Supabase signOut failed, clearing local auth state anyway:', error);
      return { error: error instanceof Error ? error : new Error('Sign out failed') };
    }
  };

  const impersonateRestaurant = (id: string | null) => {
    if (id) {
      localStorage.setItem('impersonated_restaurant_id', id);
      setAuthState(prev => ({ 
        ...prev, 
        restaurantId: id 
      }));
    } else {
      localStorage.removeItem('impersonated_restaurant_id');
      setAuthState(prev => ({ 
        ...prev, 
        restaurantId: null 
      }));
    }
  };

  const getRouteForRole = (role: AppRole | null): string => {
    switch (role) {
      case 'super_admin': return '/super-admin';
      case 'restaurant_admin': return '/admin';
      case 'kitchen_staff': return '/kitchen';
      case 'waiter_staff': return '/waiter';
      case 'billing_staff': return '/billing';
      default: return '/roles';
    }
  };

  return { ...authState, signIn, signUp, signOut, impersonateRestaurant, getRouteForRole };
};
