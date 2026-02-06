import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  BarChart3,
  Plus,
  Search,
  Check,
  X,
  Loader2,
  Power,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRestaurants, useCreateRestaurant, useUpdateRestaurant, useDeleteRestaurant } from '@/hooks/useRestaurant';
import { useAuth } from '@/hooks/useAuth';
import { TenantStats } from '@/components/superadmin/TenantStats';
import { MonthlyTrendChart } from '@/components/superadmin/MonthlyTrendChart';
import { TenantTable } from '@/components/superadmin/TenantTable';
import { EditHotelProfile } from '@/components/superadmin/EditHotelProfile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Tables } from '@/integrations/supabase/types';

type Restaurant = Tables<"restaurants">;

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useAuth();
  
  const [activeTab, setActiveTab] = useState('restaurants');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  
  // Restaurant form state
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    subscription_tier: 'free' as 'free' | 'pro' | 'enterprise',
  });

  // Fetch restaurants
  const { data: restaurants = [], isLoading } = useRestaurants();
  const createRestaurant = useCreateRestaurant();
  const updateRestaurant = useUpdateRestaurant();
  const deleteRestaurant = useDeleteRestaurant();

  // Filter restaurants
  const filteredRestaurants = useMemo(() => {
    if (!searchQuery) return restaurants;
    const query = searchQuery.toLowerCase();
    return restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.slug.toLowerCase().includes(query) ||
        r.email?.toLowerCase().includes(query)
    );
  }, [restaurants, searchQuery]);

  const handleAddRestaurant = async () => {
    if (!newRestaurant.name || !newRestaurant.slug) {
      toast({
        title: 'Missing Fields',
        description: 'Name and slug are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createRestaurant.mutateAsync({
        name: newRestaurant.name,
        slug: newRestaurant.slug.toLowerCase().replace(/\s+/g, '-'),
        email: newRestaurant.email || undefined,
        phone: newRestaurant.phone || undefined,
        address: newRestaurant.address || undefined,
        subscription_tier: newRestaurant.subscription_tier,
        is_active: true,
      });

      toast({
        title: 'Restaurant Created',
        description: `${newRestaurant.name} has been added.`,
      });

      setNewRestaurant({
        name: '',
        slug: '',
        email: '',
        phone: '',
        address: '',
        subscription_tier: 'free',
      });
      setShowAddForm(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create restaurant.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (id: string, currentValue: boolean) => {
    try {
      await updateRestaurant.mutateAsync({
        id,
        updates: { is_active: !currentValue },
      });
      toast({
        title: 'Status Updated',
        description: `Restaurant is now ${!currentValue ? 'active' : 'inactive'}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status.',
        variant: 'destructive',
      });
    }
  };

  const handleChangeTier = async (id: string, tier: 'free' | 'pro' | 'enterprise') => {
    try {
      await updateRestaurant.mutateAsync({
        id,
        updates: { subscription_tier: tier },
      });
      toast({
        title: 'Plan Updated',
        description: `Subscription changed to ${tier}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update plan.',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (id: string) => {
    const restaurant = restaurants.find(r => r.id === id);
    if (restaurant) {
      setEditingRestaurant(restaurant);
    }
  };

  const handleSaveRestaurant = async (updates: Partial<Restaurant>) => {
    if (!editingRestaurant) return;
    await updateRestaurant.mutateAsync({
      id: editingRestaurant.id,
      updates,
    });
    setEditingRestaurant(null);
  };

  const handleDeleteRestaurant = async (id: string) => {
    await deleteRestaurant.mutateAsync(id);
    setEditingRestaurant(null);
  };

  // Check if user is super admin
  if (role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Power className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You need Super Admin privileges to access this page.
            </p>
            <Button onClick={() => navigate('/admin')}>Go to Admin Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show Edit Profile view
  if (editingRestaurant) {
    return (
      <div className="min-h-screen bg-muted/30">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-sidebar text-sidebar-foreground">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <img src="/qr-logo.svg" alt="QR Dine Pro" className="w-6 h-6" style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              <div>
                <h1 className="text-lg font-bold">Super Admin</h1>
                <p className="text-xs text-sidebar-foreground/70">Admin Dashboard</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground p-4 hidden lg:block">
            <nav className="space-y-1 mt-4">
              <button
                onClick={() => setEditingRestaurant(null)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent"
              >
                <Building2 className="w-5 h-5" />
                Dashboard
              </button>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
                <Building2 className="w-5 h-5" />
                Tenants
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <EditHotelProfile
              restaurant={editingRestaurant}
              onSave={handleSaveRestaurant}
              onDelete={handleDeleteRestaurant}
              onBack={() => setEditingRestaurant(null)}
              isSaving={updateRestaurant.isPending}
            />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <img src="/qr-logo.svg" alt="QR Dine Pro" className="w-6 h-6" style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Super Admin</h1>
                <p className="text-sm text-muted-foreground">
                  Platform Management Console
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/admin')}>
              Back to Admin
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Enhanced Stats Row */}
        <TenantStats restaurants={restaurants} totalRevenue={0} currencySymbol="₹" />

        {/* Restaurants Tab */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="restaurants">
              <Building2 className="w-4 h-4 mr-2" />
              Restaurants
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="restaurants" className="mt-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Restaurants</CardTitle>
                    <CardDescription>
                      Manage all restaurants on the platform
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-[200px]"
                      />
                    </div>
                    <Button onClick={() => setShowAddForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Restaurant
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Add Form */}
                <AnimatePresence>
                  {showAddForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 p-4 border rounded-lg bg-muted/50"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Name *</Label>
                          <Input
                            value={newRestaurant.name}
                            onChange={(e) =>
                              setNewRestaurant({ ...newRestaurant, name: e.target.value })
                            }
                            placeholder="Restaurant Name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Slug * (URL identifier)</Label>
                          <Input
                            value={newRestaurant.slug}
                            onChange={(e) =>
                              setNewRestaurant({ ...newRestaurant, slug: e.target.value })
                            }
                            placeholder="restaurant-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Subscription</Label>
                          <Select
                            value={newRestaurant.subscription_tier}
                            onValueChange={(v: 'free' | 'pro' | 'enterprise') =>
                              setNewRestaurant({ ...newRestaurant, subscription_tier: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={newRestaurant.email}
                            onChange={(e) =>
                              setNewRestaurant({ ...newRestaurant, email: e.target.value })
                            }
                            placeholder="contact@restaurant.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input
                            value={newRestaurant.phone}
                            onChange={(e) =>
                              setNewRestaurant({ ...newRestaurant, phone: e.target.value })
                            }
                            placeholder="+91 9876543210"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Address</Label>
                          <Input
                            value={newRestaurant.address}
                            onChange={(e) =>
                              setNewRestaurant({ ...newRestaurant, address: e.target.value })
                            }
                            placeholder="123 Main Street"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={handleAddRestaurant}
                          disabled={createRestaurant.isPending}
                        >
                          {createRestaurant.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mr-2" />
                          )}
                          Create Restaurant
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddForm(false)}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Table */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : (
                  <TenantTable
                    restaurants={filteredRestaurants}
                    onToggleActive={handleToggleActive}
                    onChangeTier={handleChangeTier}
                    onViewDetails={handleViewDetails}
                    onDelete={handleDeleteRestaurant}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6 space-y-6">
            {/* Monthly Trends Chart */}
            <MonthlyTrendChart restaurants={restaurants} currencySymbol="₹" months={6} />

            {/* Tenant Performance Table */}
            <TenantTable
              restaurants={restaurants}
              onToggleActive={handleToggleActive}
              onChangeTier={handleChangeTier}
              onViewDetails={handleViewDetails}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
