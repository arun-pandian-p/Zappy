import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff, ChefHat, Shield, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const featureCards = [
  { icon: Shield, title: 'Admin Control', desc: 'Full dashboard access & staff management', color: 'from-blue-500 to-blue-600' },
  { icon: ChefHat, title: 'Kitchen Display', desc: 'Real-time order queue & prep tracking', color: 'from-orange-500 to-amber-500' },
  { icon: Receipt, title: 'Billing POS', desc: 'Fast checkout, splits & receipt printing', color: 'from-emerald-500 to-green-500' },
];

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, user, role, loading: authLoading, getRouteForRole } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      const route = getRouteForRole(role);
      navigate(route);
    }
  }, [user, role, authLoading, navigate, getRouteForRole]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Error', description: 'Please enter email and password', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }
    toast({ title: 'Welcome back!', description: 'Logged in successfully' });
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 overflow-hidden">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left — Form */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white">Staff Portal</h1>
                <p className="text-sm text-slate-400 mt-1">Secure access for restaurant staff operations</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input id="email" type="email" placeholder="you@restaurant.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} autoComplete="email" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-400 focus-visible:ring-blue-400/30" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} autoComplete="current-password" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-400 focus-visible:ring-blue-400/30" />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="pt-4 border-t border-white/10 text-center">
              <Button variant="link" className="text-sm text-slate-400 hover:text-white" onClick={() => navigate('/')}>← Back to Home</Button>
            </div>
          </div>
        </motion.div>

        {/* Right — Features */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="hidden lg:flex flex-col gap-6">
          <div>
            <h2 className="text-3xl font-bold text-white">Smart Staff Workspace</h2>
            <p className="text-slate-400 mt-2 leading-relaxed">Role-based access for seamless restaurant operations from kitchen to billing — all synchronized in real time.</p>
          </div>
          <div className="space-y-4">
            {featureCards.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center shrink-0`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">{f.title}</h3>
                  <p className="text-slate-400 text-xs mt-0.5">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
