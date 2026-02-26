import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
// supabase import removed - using localStorage cleanup instead
import { lovable } from '@/integrations/lovable/index';

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, user, role, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      if (role === 'super_admin') {
        navigate('/super-admin');
      } else if (role) {
        toast({ title: 'Access Denied', description: 'This portal is for Super Admins only.', variant: 'destructive' });
      }
    }
  }, [user, role, authLoading, navigate, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Error', description: 'Please enter email and password', variant: 'destructive' });
      return;
    }
    setLoading(true);

    // Clear all stale auth data from storage before login
    const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith('sb-'));
    keysToRemove.forEach(k => localStorage.removeItem(k));

    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  if (authLoading) {
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
          <img src="/zappy-logo.jpg" alt="ZAPPY" className="h-20 mx-auto rounded-xl" />
          <h1 className="text-5xl font-bold text-white tracking-tight">ZAPPY</h1>
          <p className="text-sm text-indigo-200 italic">Scan, Order, Eat, Repeat</p>
          <p className="text-indigo-100 text-lg leading-relaxed">Platform Command Center — Manage tenants, monitor health, and control settings.</p>
          {/* CSS illustration: geometric command center */}
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

          <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                placeholder="admin@zappy.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="off"
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
                autoComplete="off"
                className="pl-10 pr-10 bg-gray-100 border-0 h-12 rounded-xl text-gray-800 placeholder:text-gray-400 focus-visible:ring-indigo-500"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base" disabled={loading}>
              {loading ? 'Authenticating...' : 'Access Console'}
            </Button>
          </form>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200" />
            <span className="mx-4 text-xs text-gray-400">or</span>
            <div className="flex-grow border-t border-gray-200" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl border-gray-200 text-gray-700 font-medium text-base hover:bg-gray-50 flex items-center justify-center gap-3"
            disabled={loading}
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth('google', {
                redirect_uri: window.location.origin,
              });
              if (error) {
                toast({ title: 'Google Sign-In Failed', description: String(error), variant: 'destructive' });
              }
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </Button>

          <div className="pt-2 border-t border-gray-100 space-y-2 text-center">
            <p className="text-xs text-gray-400">Restricted area. Unauthorized access attempts are logged.</p>
            <button className="text-sm text-gray-400 hover:text-gray-600 transition-colors" onClick={() => navigate('/admin/login')}>Restaurant Admin Login →</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SuperAdminLogin;
