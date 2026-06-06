import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface RoleGuardProps {
  allowedRoles: AppRole[];
  children: React.ReactNode;
}

const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Inactivity timeout: 30 minutes of no user interaction
  useEffect(() => {
    if (!user || role === 'super_admin' || !role || !allowedRoles.includes(role)) return;

    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        console.warn('[RoleGuard] Session expired due to inactivity');
        await signOut();
        navigate('/login?expired=true', { replace: true });
      }, INACTIVITY_TIMEOUT);
    };

    // Events to monitor for active user engagement
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Initialize timer
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user, role, allowedRoles, signOut, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Super admins bypass all guards
  if (role === 'super_admin') {
    return <>{children}</>;
  }

  if (!role || !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <span className="text-2xl">🚫</span>
          </div>
          <h1 className="text-xl font-bold">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            You don't have permission to access this page. Please contact your administrator.
          </p>
          <a href="/login" className="text-primary text-sm underline">
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;
