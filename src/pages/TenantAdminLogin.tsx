import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff, ChefHat, Receipt, UserPlus, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const TenantAdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, user, role, loading: authLoading, getRouteForRole } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // Redirect if already logged in
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
      toast({
        title: 'Error',
        description: 'Please enter email and password',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    toast({ title: 'Welcome back!', description: 'Logged in successfully' });
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please enter email and password',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password);
    
    if (error) {
      toast({
        title: 'Sign Up Failed',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    toast({ 
      title: 'Account Created!', 
      description: 'Please wait for an admin to assign your role.' 
    });
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-orange-100 shadow-xl shadow-orange-100/50">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-200">
              <UtensilsCrossed className="w-10 h-10 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Restaurant Staff Portal</CardTitle>
              <CardDescription className="mt-2">
                Sign in to manage your restaurant
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="staff@restaurant.com"
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

                  <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@restaurant.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        autoComplete="new-password"
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
                    <p className="text-xs text-muted-foreground">
                      Minimum 6 characters
                    </p>
                  </div>

                  <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600" disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  After sign up, an admin must assign you a role to access dashboards.
                </p>
              </TabsContent>
            </Tabs>

            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Staff Roles
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
                  <UtensilsCrossed className="w-6 h-6 mx-auto text-orange-500 mb-1" />
                  <p className="text-xs font-medium">Admin</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
                  <ChefHat className="w-6 h-6 mx-auto text-orange-500 mb-1" />
                  <p className="text-xs font-medium">Kitchen</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
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

export default TenantAdminLogin;
