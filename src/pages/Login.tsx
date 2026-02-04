import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff, ChefHat, Shield, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please enter email and password',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    // Simulate login - in a real app, this would authenticate with a backend
    setTimeout(() => {
      // Demo: Route based on email pattern
      if (email.includes('admin')) {
        toast({ title: 'Welcome Admin!', description: 'Logged in successfully' });
        navigate('/admin');
      } else if (email.includes('kitchen')) {
        toast({ title: 'Welcome Kitchen Staff!', description: 'Logged in successfully' });
        navigate('/kitchen');
      } else if (email.includes('billing')) {
        toast({ title: 'Welcome Billing Staff!', description: 'Logged in successfully' });
        navigate('/billing');
      } else if (email.includes('waiter')) {
        toast({ title: 'Welcome Waiter!', description: 'Logged in successfully' });
        navigate('/waiter');
      } else {
        toast({ title: 'Welcome!', description: 'Logged in successfully' });
        navigate('/roles');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-2">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Staff Login</CardTitle>
              <CardDescription className="mt-2">
                Sign in to access your dashboard
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Staff Roles
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-muted/50">
                  <Shield className="w-6 h-6 mx-auto text-primary mb-1" />
                  <p className="text-xs font-medium">Admin</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <ChefHat className="w-6 h-6 mx-auto text-orange-500 mb-1" />
                  <p className="text-xs font-medium">Kitchen</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <Receipt className="w-6 h-6 mx-auto text-green-500 mb-1" />
                  <p className="text-xs font-medium">Billing</p>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                className="text-sm"
                onClick={() => navigate('/')}
              >
                ← Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
