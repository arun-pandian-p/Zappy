import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { apiClient } from '@/services/apiClient';
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
  localStorage.removeItem('zappy_access_token');
  localStorage.removeItem('zappy_refresh_token');
  localStorage.removeItem('zappy_user');

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
        // First check Java backend session in localStorage
        const storedUser = localStorage.getItem('zappy_user');
        const storedToken = localStorage.getItem('zappy_access_token');
        if (storedUser && storedToken) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setAuthState({
              user: { id: parsedUser.id, email: parsedUser.email } as any,
              session: { access_token: storedToken } as any,
              role: parsedUser.role as AppRole,
              restaurantId: parsedUser.restaurantId,
              originalRestaurantId: parsedUser.restaurantId,
              loading: false,
            });
            return;
          } catch (e) {
            console.warn('Failed to parse local stored user', e);
          }
        }

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
          const storedUser = localStorage.getItem('zappy_user');
          if (!storedUser) {
            setLoggedOutState();
          }
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
    try {
      // 1. Authenticate with Java Spring Boot backend
      const javaAuth = await apiClient.login(email, password);

      if (javaAuth?.user) {
        setAuthState({
          user: { id: javaAuth.user.id, email: javaAuth.user.email } as any,
          session: { access_token: javaAuth.accessToken } as any,
          role: javaAuth.user.role as any,
          restaurantId: javaAuth.user.restaurantId,
          originalRestaurantId: javaAuth.user.restaurantId,
          loading: false,
        });
      }

      // Also authenticate Supabase session for real-time channels if reachable
      try {
        await supabase.auth.signInWithPassword({ email, password });
      } catch (err) {
        console.warn('Supabase real-time sync note:', err);
      }

      return { data: javaAuth, error: null };
    } catch (err: any) {
      // Fallback to supabase if backend is offline
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data?.user) {
          return { data, error: null };
        }
      } catch (_) {}
      return { data: null, error: { message: err.message || 'Login failed' } };
    }
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
    try {
      await apiClient.logout();
    } catch (err) {
      console.warn('API logout notice:', err);
    }
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
      console.warn('Supabase signOut notice:', error);
      return { error: null };
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
