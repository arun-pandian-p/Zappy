import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const SuperAdminSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await signUp(email, password);
      if (error) {
        toast({ title: 'Signup Failed', description: error.message, variant: 'destructive' });
        setLoading(false);
        return;
      }
      toast({
        title: 'Account Created',
        description: 'Please check your email to verify your account before logging in.',
      });
      setLoading(false);
      navigate('/super-admin/login');
    } catch (err) {
      toast({ title: 'Signup Failed', description: 'Network error. Please try again.', variant: 'destructive' });
      setLoading(false);
    }
  };

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
          <p className="text-indigo-100 text-lg leading-relaxed">Create your platform account — Join as a Super Admin to manage tenants and control settings.</p>
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
            <h2 className="text-3xl font-bold italic text-gray-800">Create Account</h2>
            <p className="text-gray-500 mt-2 text-sm">Sign up for the platform console</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                placeholder="your@email.com"
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
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                className="pl-10 pr-10 bg-gray-100 border-0 h-12 rounded-xl text-gray-800 placeholder:text-gray-400 focus-visible:ring-indigo-500"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                className="pl-10 bg-gray-100 border-0 h-12 rounded-xl text-gray-800 placeholder:text-gray-400 focus-visible:ring-indigo-500"
              />
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="pt-2 border-t border-gray-100 space-y-2 text-center">
            <p className="text-xs text-gray-400">After signup, a Super Admin must assign your role.</p>
            <button className="text-sm text-indigo-500 hover:text-indigo-700 transition-colors font-medium" onClick={() => navigate('/super-admin/login')}>Already have an account? Sign in →</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SuperAdminSignup;
