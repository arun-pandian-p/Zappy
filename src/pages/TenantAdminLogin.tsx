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

const TenantAdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, user, role, loading: authLoading, getRouteForRole } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      if (role === 'super_admin') {
        navigate('/super-admin');
      } else if (role) {
        const route = getRouteForRole(role);
        navigate(route);
      }
    }
  }, [user, role, authLoading, navigate, getRouteForRole]);

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
    } else {
      toast({ title: 'Welcome back!', description: 'Logged in successfully' });
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-8%] right-[-5%] w-80 h-80 bg-yellow-300/30 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[10%] w-96 h-96 bg-orange-300/20 rounded-full blur-3xl" />
      <div className="absolute top-[50%] left-[30%] w-40 h-40 bg-amber-200/20 rounded-full blur-2xl" />

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
          <p className="text-sm text-orange-200 italic">Scan, Order, Eat, Repeat</p>
          <p className="text-orange-100 text-lg leading-relaxed">Complete Restaurant Control — Menu, orders, staff, and analytics in one place.</p>
          {/* CSS illustration: plate + utensils */}
          <div className="relative mx-auto w-48 h-40 mt-8">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border-4 border-white/25 bg-white/10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-white/15" />
            <div className="absolute top-[15%] left-[15%] w-2 h-20 bg-white/20 rounded-full rotate-[-15deg]" />
            <div className="absolute top-[15%] right-[15%] w-2 h-20 bg-white/20 rounded-full rotate-[15deg]" />
            <div className="absolute top-[12%] right-[22%] w-3 h-6 bg-white/15 rounded-full rotate-[15deg]" />
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
            <p className="text-gray-500 mt-2 text-sm">Sign in to manage your restaurant</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                placeholder="admin@restaurant.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                className="pl-10 bg-gray-100 border-0 h-12 rounded-xl text-gray-800 placeholder:text-gray-400 focus-visible:ring-orange-500"
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
                className="pl-10 pr-10 bg-gray-100 border-0 h-12 rounded-xl text-gray-800 placeholder:text-gray-400 focus-visible:ring-orange-500"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
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

          <div className="text-center">
            <button className="text-sm text-gray-400 hover:text-gray-600 transition-colors" onClick={() => navigate('/')}>← Back to Home</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TenantAdminLogin;
