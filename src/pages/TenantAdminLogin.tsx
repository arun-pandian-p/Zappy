import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const TenantAdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session?.user) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.session.user.id)
            .single();
          if (roleData?.role === 'super_admin') {
            navigate('/super-admin');
            return;
          } else if (roleData?.role) {
            const routes: Record<string, string> = {
              restaurant_admin: '/admin',
              kitchen_staff: '/kitchen',
              waiter_staff: '/waiter',
              billing_staff: '/billing',
            };
            navigate(routes[roleData.role] || '/admin');
            return;
          }
        }
      } catch {
        // Network error — show login form
      }
      if (!cancelled) setCheckingAuth(false);
    };
    checkSession();
    return () => { cancelled = true; };
  }, [navigate]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Error', description: 'Please enter email and password', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setNetworkError(false);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message === 'Failed to fetch') {
          setNetworkError(true);
          toast({ title: 'Connection Failed', description: 'Cannot reach the server. Check your internet or try incognito mode.', variant: 'destructive' });
        } else {
          toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
        }
        setLoading(false);
        return;
      }

      if (data.session?.user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.session.user.id)
          .single();

        if (roleData?.role === 'super_admin') {
          navigate('/super-admin');
        } else if (roleData?.role) {
          const routes: Record<string, string> = {
            restaurant_admin: '/admin',
            kitchen_staff: '/kitchen',
            waiter_staff: '/waiter',
            billing_staff: '/billing',
          };
          toast({ title: 'Welcome back!', description: 'Logged in successfully' });
          navigate(routes[roleData.role] || '/admin');
        } else {
          toast({ title: 'No Role', description: 'No role assigned to this account.', variant: 'destructive' });
          await supabase.auth.signOut();
        }
      }
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') {
        setNetworkError(true);
        toast({ title: 'Connection Failed', description: 'Cannot reach the server after retries.', variant: 'destructive' });
      } else {
        toast({ title: 'Login Failed', description: err?.message || 'Please try again.', variant: 'destructive' });
      }
    }
    setLoading(false);
  }, [email, password, navigate, toast]);

  const handleRetry = () => {
    setNetworkError(false);
    window.location.reload();
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 relative overflow-hidden">
      <div className="absolute top-[-8%] right-[-5%] w-80 h-80 bg-yellow-300/30 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[10%] w-96 h-96 bg-orange-300/20 rounded-full blur-3xl" />
      <div className="absolute top-[50%] left-[30%] w-40 h-40 bg-amber-200/20 rounded-full blur-2xl" />

      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex flex-1 flex-col justify-center items-center relative z-10 px-12"
      >
        <div className="text-center space-y-6 max-w-md">
          <h1 className="text-5xl font-bold text-white tracking-tight">QR Dine</h1>
          <p className="text-orange-100 text-lg leading-relaxed">Complete Restaurant Control — Menu, orders, staff, and analytics in one place.</p>
          <div className="relative mx-auto w-48 h-40 mt-8">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border-4 border-white/25 bg-white/10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-white/15" />
            <div className="absolute top-[15%] left-[15%] w-2 h-20 bg-white/20 rounded-full rotate-[-15deg]" />
            <div className="absolute top-[15%] right-[15%] w-2 h-20 bg-white/20 rounded-full rotate-[15deg]" />
            <div className="absolute top-[12%] right-[22%] w-3 h-6 bg-white/15 rounded-full rotate-[15deg]" />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex-1 flex items-center justify-center p-6 relative z-10"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold italic text-gray-800">Welcome Back</h2>
            <p className="text-gray-500 mt-2 text-sm">Sign in to manage your restaurant</p>
          </div>

          {networkError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <WifiOff className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-red-800">Connection Failed</p>
                <p className="text-red-600 mt-1">Cannot reach the server. Try:</p>
                <ul className="text-red-600 mt-1 list-disc list-inside space-y-0.5">
                  <li>Disable ad blockers / privacy extensions</li>
                  <li>Open in incognito / private window</li>
                  <li>Check your internet connection</li>
                </ul>
                <Button variant="outline" size="sm" className="mt-3 text-red-700 border-red-300 hover:bg-red-100" onClick={handleRetry}>
                  <RefreshCw className="h-3 w-3 mr-1" /> Retry Connection
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input type="email" placeholder="admin@restaurant.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} autoComplete="email" className="pl-10 bg-gray-100 border-0 h-12 rounded-xl text-gray-800 placeholder:text-gray-400 focus-visible:ring-orange-500" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} autoComplete="current-password" className="pl-10 pr-10 bg-gray-100 border-0 h-12 rounded-xl text-gray-800 placeholder:text-gray-400 focus-visible:ring-orange-500" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base" disabled={loading}>
              {loading ? <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Connecting...</span> : 'Sign In'}
            </Button>
          </form>

          <div className="text-center">
            <button className="text-sm text-gray-400 hover:text-gray-600 transition-colors" onClick={() => navigate('/')}>← Back to Home</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TenantAdminLogin;
