import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Clear ALL stale Supabase auth data immediately (before any hook runs)
const STORAGE_KEY = `sb-syvoshzxoedamaijongb-auth-token`;
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    if (!parsed?.access_token || !parsed?.refresh_token || (parsed?.expires_at && parsed.expires_at * 1000 < Date.now())) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
} catch {
  localStorage.removeItem(STORAGE_KEY);
}

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check existing session on mount — bypasses useAuth to avoid stale token loops
  useEffect(() => {
    let cancelled = false;
    const checkSession = async () => {
      try {
        // Force clear any stale session first
        await supabase.auth.signOut({ scope: 'local' });
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
          }
        }
      } catch {
        // Network error on session check is fine — just show the login form
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

    // Retry logic — try up to 3 times with increasing delay
    let lastError: string | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise(r => setTimeout(r, attempt * 1000));
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          if (error.message === 'Failed to fetch') {
            lastError = 'network';
            continue; // retry
          }
          toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
          setLoading(false);
          return;
        }

        if (data.session?.user) {
          // Check role
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.session.user.id)
            .single();

          if (roleData?.role === 'super_admin') {
            toast({ title: 'Welcome!', description: 'Redirecting to dashboard...' });
            navigate('/super-admin');
          } else {
            toast({ title: 'Access Denied', description: 'This portal is for Super Admins only.', variant: 'destructive' });
            await supabase.auth.signOut({ scope: 'local' });
          }
          setLoading(false);
          return;
        }
      } catch (err: any) {
        if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') {
          lastError = 'network';
          continue; // retry
        }
        lastError = err?.message || 'Unknown error';
      }
    }

    // All retries exhausted
    setLoading(false);
    if (lastError === 'network') {
      setNetworkError(true);
      toast({
        title: 'Connection Failed',
        description: 'Cannot reach the server. Please check your internet, disable ad blockers, or try incognito mode.',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Login Failed', description: lastError || 'Please try again.', variant: 'destructive' });
    }
  }, [email, password, navigate, toast]);

  const handleRetry = () => {
    setNetworkError(false);
    window.location.reload();
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-600">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-500 via-purple-600 to-violet-700 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[10%] w-80 h-80 bg-indigo-300/30 rounded-full blur-3xl" />
      <div className="absolute bottom-[-5%] right-[5%] w-72 h-72 bg-purple-400/20 rounded-full blur-3xl" />
      <div className="absolute top-[40%] right-[30%] w-48 h-48 bg-violet-300/15 rounded-full blur-2xl" />

      {/* Left — Decorative Panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex flex-1 flex-col justify-center items-center relative z-10 px-12"
      >
        <div className="text-center space-y-6 max-w-md">
          <h1 className="text-5xl font-bold text-white tracking-tight">QR Dine</h1>
          <p className="text-indigo-100 text-lg leading-relaxed">Platform Command Center — Manage tenants, monitor health, and control settings.</p>
          <div className="relative mx-auto w-48 h-40 mt-8">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-20 bg-white/10 rounded-lg border-2 border-white/20" />
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-16 flex flex-wrap gap-1.5 items-center justify-center p-2">
              <div className="w-5 h-5 rounded bg-white/20" />
              <div className="w-5 h-5 rounded bg-white/15" />
              <div className="w-5 h-5 rounded bg-white/25" />
              <div className="w-5 h-5 rounded bg-white/10" />
              <div className="w-5 h-5 rounded bg-white/20" />
              <div className="w-5 h-5 rounded bg-white/15" />
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-20 h-2 bg-white/20 rounded-full" />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-3 h-4 bg-white/15 rounded-t" />
          </div>
        </div>
      </motion.div>

      {/* Right — Form Card */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex-1 flex items-center justify-center p-6 relative z-10"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold italic text-gray-800">Welcome Back</h2>
            <p className="text-gray-500 mt-2 text-sm">Sign in to the platform console</p>
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 text-red-700 border-red-300 hover:bg-red-100"
                  onClick={handleRetry}
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Retry Connection
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                placeholder="superadmin@qrdine.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                className="pl-10 bg-gray-100 border-0 h-12 rounded-xl text-gray-800 placeholder:text-gray-400 focus-visible:ring-indigo-500"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                className="pl-10 pr-10 bg-gray-100 border-0 h-12 rounded-xl text-gray-800 placeholder:text-gray-400 focus-visible:ring-indigo-500"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Connecting...
                </span>
              ) : 'Access Console'}
            </Button>
          </form>

          <div className="pt-2 border-t border-gray-100 space-y-2 text-center">
            <p className="text-xs text-gray-400">Restricted area. Unauthorized access attempts are logged.</p>
            <button className="text-sm text-indigo-500 hover:text-indigo-700 transition-colors font-medium" onClick={() => navigate('/super-admin/signup')}>Don't have an account? Sign up →</button>
            <button className="text-sm text-gray-400 hover:text-gray-600 transition-colors block mx-auto" onClick={() => navigate('/admin/login')}>Restaurant Admin Login →</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SuperAdminLogin;
