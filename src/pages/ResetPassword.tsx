import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { apiClient } from '@/services/apiClient';
import { ZappyLogo } from '@/components/branding/ZappyLogo';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkRecovery = async () => {
      try {
        const hash = window.location.hash || "";
        const search = window.location.search || "";
        
        // Check for Java token or recovery params
        if (
          search.includes("token=") ||
          hash.includes("type=recovery") || 
          hash.includes("access_token=") || 
          search.includes("type=recovery") || 
          search.includes("code=")
        ) {
          setIsRecovery(true);
          return;
        }

        // Fallback: check if we already have an active session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session && !error) {
          setIsRecovery(true);
        }
      } finally {
        setChecking(false);
      }
    };

    checkRecovery();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'Too short', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'Mismatch', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    setLoading(true);

    const searchParams = new URLSearchParams(window.location.search);
    const javaToken = searchParams.get('token');

    if (javaToken) {
      try {
        // 1. Reset via Java Spring Boot backend
        await apiClient.resetPassword(javaToken, password);
        toast({ title: 'Password updated', description: 'You can now sign in with your new password.' });
        navigate('/login', { replace: true });
        setLoading(false);
        return;
      } catch (err: any) {
        toast({ title: 'Error', description: err.message || 'Reset failed', variant: 'destructive' });
        setLoading(false);
        return;
      }
    }

    // 2. Fallback to Supabase updateUser
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password updated', description: 'You can now sign in with your new password.' });
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
    }
    setLoading(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-[420px] text-center space-y-4">
          <h2 className="text-xl font-bold text-slate-800">Verifying link...</h2>
          <p className="text-slate-500 text-sm">Please wait while we verify your password reset link.</p>
        </div>
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-[420px] text-center space-y-4">
          <h2 className="text-xl font-bold text-slate-800">Invalid Reset Link</h2>
          <p className="text-slate-500 text-sm">This link is invalid or has expired. Please request a new one.</p>
          <Button onClick={() => navigate('/forgot-password')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Request New Link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden p-6">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 w-full max-w-[420px] space-y-6 relative z-10"
      >
        <div className="text-center">
          <ZappyLogo size={64} compact className="mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">Set New Password</h2>
          <p className="text-slate-500 mt-1 text-sm">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                className="pl-10 pr-10 h-11 rounded-lg border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                className="pl-10 h-11 rounded-lg border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm"
            disabled={loading}
          >
            {loading ? 'Updating…' : 'Update Password'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
