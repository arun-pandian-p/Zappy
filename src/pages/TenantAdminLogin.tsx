import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

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

    // Clear any stale session first
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (_) {}

    let lastError: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await signIn(email, password);
      if (!error) {
        toast({ title: 'Welcome back!', description: 'Logged in successfully' });
        setLoading(false);
        return;
      }
      lastError = error;
      if (error.message !== 'Failed to fetch') break;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }

    toast({ title: 'Login Failed', description: lastError?.message || 'Unknown error', variant: 'destructive' });
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
          <h1 className="text-5xl font-bold text-white tracking-tight">QR Dine</h1>
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

          <div className="text-center">
            <button className="text-sm text-gray-400 hover:text-gray-600 transition-colors" onClick={() => navigate('/')}>← Back to Home</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TenantAdminLogin;
