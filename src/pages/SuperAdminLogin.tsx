import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const featureCards = [
  { emoji: '🏢', title: 'Tenant Management', desc: 'Onboard, configure & monitor all restaurants', ringColor: 'ring-blue-500/40' },
  { emoji: '🛰️', title: 'System Monitoring', desc: 'Platform health, logs & real-time metrics', ringColor: 'ring-amber-500/40' },
  { emoji: '⚙️', title: 'Platform Config', desc: 'Global settings, plans & email templates', ringColor: 'ring-emerald-500/40' },
];

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
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/8 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left — Form */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24 ring-4 ring-indigo-500/50 shadow-lg shadow-indigo-500/30">
                <AvatarFallback className="text-4xl bg-indigo-500/10 text-white">🧑‍💻</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white">Welcome Back!</h1>
                <p className="text-sm text-slate-400 mt-1">Sign in to the platform console</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input id="email" type="email" placeholder="superadmin@qrdine.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} autoComplete="email" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-400 focus-visible:ring-indigo-400/30" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} autoComplete="current-password" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-400 focus-visible:ring-indigo-400/30" />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white" disabled={loading}>
                {loading ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Authenticating...</>
                ) : (
                  <><LogIn className="w-4 h-4 mr-2" />Access Console</>
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-white/10 space-y-2 text-center">
              <p className="text-xs text-slate-500">This is a restricted area. Unauthorized access attempts are logged and monitored.</p>
              <Button variant="link" className="text-sm text-slate-400 hover:text-white" onClick={() => navigate('/admin/login')}>Restaurant Admin Login →</Button>
            </div>
          </div>
        </motion.div>

        {/* Right — Features */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="hidden lg:flex flex-col gap-6">
          <div>
            <h2 className="text-3xl font-bold text-white">Platform Command Center</h2>
            <p className="text-slate-400 mt-2 leading-relaxed">Manage all tenants, monitor platform health, and control system-wide settings.</p>
          </div>
          <div className="space-y-4">
            {featureCards.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-4">
                <Avatar className={`h-12 w-12 ring-2 ${f.ringColor} shrink-0`}>
                  <AvatarFallback className="text-xl bg-white/5">{f.emoji}</AvatarFallback>
                </Avatar>
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

export default SuperAdminLogin;
