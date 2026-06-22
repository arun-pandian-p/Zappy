import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Loader2,
  Power,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useRestaurants, useUpdateRestaurant, useDeleteRestaurant } from '@/hooks/useRestaurant';
import { useAuth } from '@/hooks/useAuth';
import { TenantStats } from '@/components/superadmin/TenantStats';
import { MonthlyTrendChart } from '@/components/superadmin/MonthlyTrendChart';
import { TenantTable } from '@/components/superadmin/TenantTable';
import { TenantPreviewCard } from '@/components/superadmin/TenantPreviewCard';
import { EditHotelProfile } from '@/components/superadmin/EditHotelProfile';
import { SuperAdminSidebar } from '@/components/superadmin/SuperAdminSidebar';
import { CreateHotelForm } from '@/components/superadmin/CreateHotelForm';
import { SubscriptionPlansManager } from '@/components/superadmin/SubscriptionPlansManager';
import { PlatformAdsManager } from '@/components/superadmin/PlatformAdsManager';
import { DefaultTaxSettings } from '@/components/superadmin/DefaultTaxSettings';
import { EmailTemplateManager } from '@/components/superadmin/EmailTemplateManager';
import { SystemLogs } from '@/components/superadmin/SystemLogs';
import { Leaderboard } from '@/components/superadmin/Leaderboard';
import { LandingCMS } from '@/components/superadmin/LandingCMS';
import { PlatformBrandingPanel } from '@/components/superadmin/PlatformBrandingPanel';
import { SuperAdminProfileEditor } from '@/components/superadmin/SuperAdminProfileEditor';
import PromotionsOverview from '@/components/superadmin/PromotionsOverview';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AdminAccountsTable from '@/components/superadmin/AdminAccountsTable';
import LeadsCRM from '@/components/superadmin/LeadsCRM';
import StorageManager from '@/pages/Admin/StorageManager';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import type { Tables } from '@/integrations/supabase/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

type Restaurant = Tables<"restaurants">;

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateHotel, setShowCreateHotel] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [tenantViewMode, setTenantViewMode] = useState<'table' | 'grid'>('table');

  const { data: restaurants = [], isLoading } = useRestaurants();

  // Fetch all tables
  const { data: allTablesData = [] } = useQuery({
    queryKey: ['super-admin-tables'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tables').select('id, restaurant_id');
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });

  // Fetch all orders
  const { data: allOrdersData = [] } = useQuery({
    queryKey: ['super-admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, restaurant_id, total_amount, created_at, status');
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });

  // Fetch all order items for top items chart
  const { data: allOrderItemsData = [] } = useQuery({
    queryKey: ['super-admin-order-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('name, quantity, price');
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });

  const tenantMetrics = useMemo(() => {
    const map: Record<string, { tableCount: number; orderCount: number; revenue: number }> = {};
    
    restaurants.forEach((r) => {
      map[r.id] = { tableCount: 0, orderCount: 0, revenue: 0 };
    });

    allTablesData.forEach((t) => {
      if (t.restaurant_id) {
        const metric = map[t.restaurant_id];
        if (metric) {
          metric.tableCount += 1;
        }
      }
    });

    allOrdersData.forEach((o) => {
      if (o.restaurant_id) {
        const metric = map[o.restaurant_id];
        if (metric) {
          metric.orderCount += 1;
          if (o.status === 'completed') {
            metric.revenue += Number(o.total_amount || 0);
          }
        }
      }
    });

    return map;
  }, [restaurants, allTablesData, allOrdersData]);

  const totalPlatformRevenue = useMemo(() => {
    return allOrdersData
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  }, [allOrdersData]);

  const topItemsData = useMemo(() => {
    const counts: Record<string, { name: string; quantity: number; revenue: number }> = {};
    allOrderItemsData.forEach((item) => {
      const name = item.name;
      const qty = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      if (!counts[name]) {
        counts[name] = { name, quantity: 0, revenue: 0 };
      }
      counts[name].quantity += qty;
      counts[name].revenue += qty * price;
    });
    return Object.values(counts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [allOrderItemsData]);

  const busyHoursData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      count: 0,
    }));
    allOrdersData.forEach((order) => {
      if (order.created_at) {
        const date = new Date(order.created_at);
        const hour = date.getHours();
        const slot = hours[hour];
        if (slot) {
          slot.count += 1;
        }
      }
    });
    return hours;
  }, [allOrdersData]);

  const updateRestaurant = useUpdateRestaurant();
  const deleteRestaurant = useDeleteRestaurant();

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('super-admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => {
        queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['staff-members'] });
        queryClient.invalidateQueries({ queryKey: ['admin-accounts'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['staff-members'] });
        queryClient.invalidateQueries({ queryKey: ['admin-accounts'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_logs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['system-logs'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

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

  const handleToggleActive = async (id: string, currentValue: boolean) => {
    try {
      await updateRestaurant.mutateAsync({ id, updates: { is_active: !currentValue } });
      toast({ title: 'Status Updated', description: `Restaurant is now ${!currentValue ? 'active' : 'inactive'}.` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update status.', variant: 'destructive' });
    }
  };

  const handleChangeTier = async (id: string, tier: 'free' | 'pro' | 'enterprise') => {
    try {
      await updateRestaurant.mutateAsync({ id, updates: { subscription_tier: tier } });
      toast({ title: 'Plan Updated', description: `Subscription changed to ${tier}.` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update plan.', variant: 'destructive' });
    }
  };

  const handleToggleAds = async (id: string, currentValue: boolean) => {
    try {
      await updateRestaurant.mutateAsync({ id, updates: { ads_enabled: !currentValue } });
      toast({ title: 'Ads Updated', description: `Restaurant is now ${!currentValue ? 'showing ads' : 'ad-free'}.` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update ads.', variant: 'destructive' });
    }
  };

  const handleViewDetails = (id: string) => {
    const restaurant = restaurants.find(r => r.id === id);
    if (restaurant) setEditingRestaurant(restaurant);
  };

  const handleSaveRestaurant = async (updates: Partial<Restaurant>) => {
    if (!editingRestaurant) return;
    await updateRestaurant.mutateAsync({ id: editingRestaurant.id, updates });
    setEditingRestaurant(null);
  };

  const handleDeleteRestaurant = async (id: string) => {
    await deleteRestaurant.mutateAsync(id);
    setEditingRestaurant(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Power className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You need Super Admin privileges.</p>
            <Button onClick={() => navigate('/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    if (editingRestaurant) {
      return (
        <EditHotelProfile
          restaurant={editingRestaurant}
          onSave={handleSaveRestaurant}
          onDelete={handleDeleteRestaurant}
          onBack={() => setEditingRestaurant(null)}
          isSaving={updateRestaurant.isPending}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <TenantStats restaurants={restaurants} totalRevenue={totalPlatformRevenue} currencySymbol="₹" />
            <MonthlyTrendChart restaurants={restaurants} orders={allOrdersData} currencySymbol="₹" months={6} />
          </div>
        );

      case 'restaurants':
        if (showCreateHotel) {
          return (
            <CreateHotelForm
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['restaurants'] });
              }}
              onCancel={() => setShowCreateHotel(false)}
            />
          );
        }
        return (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Tenants / Hotels</CardTitle>
                  <CardDescription>Manage all restaurants on the platform</CardDescription>
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
                  <div className="flex items-center bg-muted rounded-lg p-0.5">
                    <Button variant={tenantViewMode === 'table' ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setTenantViewMode('table')}>
                      <List className="w-4 h-4" />
                    </Button>
                    <Button variant={tenantViewMode === 'grid' ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setTenantViewMode('grid')}>
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button onClick={() => setShowCreateHotel(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Hotel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : tenantViewMode === 'table' ? (
                <TenantTable
                  restaurants={filteredRestaurants}
                  metrics={tenantMetrics}
                  onToggleActive={handleToggleActive}
                  onChangeTier={handleChangeTier}
                  onToggleAds={handleToggleAds}
                  onViewDetails={handleViewDetails}
                  onDelete={handleDeleteRestaurant}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRestaurants.map((restaurant) => (
                    <TenantPreviewCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      onToggleActive={handleToggleActive}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                  {filteredRestaurants.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No restaurants found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MonthlyTrendChart restaurants={restaurants} orders={allOrdersData} currencySymbol="₹" months={6} />
              </div>
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Top Selling Items</CardTitle>
                  <CardDescription>Overall item sales volume</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {topItemsData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      No order data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topItemsData} layout="vertical" margin={{ left: 20, right: 10, top: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={80} style={{ fontSize: 11 }} />
                        <RechartsTooltip />
                        <Bar dataKey="quantity" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Qty Sold" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-0 shadow-md lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Busiest Hours</CardTitle>
                  <CardDescription>Platform-wide order frequency by hour of the day</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={busyHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="hour" style={{ fontSize: 11 }} />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Orders" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Platform Metrics Summary</CardTitle>
                  <CardDescription>Aggregated operations status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-sm text-muted-foreground">Total Revenue</span>
                    <span className="font-bold text-lg text-emerald-600">₹{totalPlatformRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-sm text-muted-foreground">Total Orders Placed</span>
                    <span className="font-bold text-lg">{allOrdersData.length}</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-sm text-muted-foreground">Active Tables Seated</span>
                    <span className="font-bold text-lg">{allTablesData.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Restaurants</span>
                    <span className="font-bold text-lg">{restaurants.filter(r => r.is_active).length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <TenantTable
              restaurants={restaurants}
              metrics={tenantMetrics}
              onToggleActive={handleToggleActive}
              onChangeTier={handleChangeTier}
              onToggleAds={handleToggleAds}
              onViewDetails={handleViewDetails}
            />
          </div>
        );

      case 'leaderboard':
        return <Leaderboard />;

      case 'leads':
        return <LeadsCRM />;

      case 'landing-cms':
        return <LandingCMS />;

      case 'branding':
        return <PlatformBrandingPanel />;

      case 'profile':
        return <SuperAdminProfileEditor />;

      case 'users':
        return <AdminAccountsTable />;

      case 'plans':
        return <SubscriptionPlansManager />;

      case 'ads':
        return <PlatformAdsManager />;

      case 'promotions':
        return <PromotionsOverview />;

      case 'storage':
        return <StorageManager />;

      case 'settings':
        return (
          <Tabs defaultValue="tax" className="space-y-4">
            <TabsList>
              <TabsTrigger value="tax">Default Tax Config</TabsTrigger>
              <TabsTrigger value="emails">Email Templates</TabsTrigger>
            </TabsList>
            <TabsContent value="tax"><DefaultTaxSettings /></TabsContent>
            <TabsContent value="emails"><EmailTemplateManager /></TabsContent>
          </Tabs>
        );

      case 'logs':
        return <SystemLogs />;

      default:
        return null;
    }
  };

  const pageTitles: Record<string, { title: string; description: string }> = {
    dashboard: { title: 'Dashboard', description: 'Platform overview and metrics' },
    restaurants: { title: 'Tenants / Hotels', description: 'Manage all tenants' },
    leads: { title: 'Leads CRM', description: 'Manage and follow up on demo requests' },
    leaderboard: { title: 'Leaderboard', description: 'Top revenue-generating restaurants' },
    analytics: { title: 'Analytics', description: 'Revenue and performance trends' },
    users: { title: 'Restaurant Admins', description: 'View restaurant admin accounts' },
    plans: { title: 'Subscription Plans', description: 'Manage platform subscription tiers' },
    ads: { title: 'Platform Ads', description: 'Manage promotional advertisements' },
    promotions: { title: 'Promotions', description: 'View restaurant-wise promotion & ad status' },
    'landing-cms': { title: 'Landing Page CMS', description: 'Edit landing page content' },
    branding: { title: 'Platform Branding', description: 'White-label appearance controls' },
    storage: { title: 'Image Storage', description: 'Global AI Menu Image Library' },
    settings: { title: 'Settings', description: 'Platform configuration' },
    logs: { title: 'System Logs', description: 'Audit trail of platform actions' },
    profile: { title: 'My Profile', description: 'Customize your admin identity' },
  };

  const currentPage = editingRestaurant
    ? { title: editingRestaurant.name, description: 'Edit restaurant profile' }
    : pageTitles[activeTab] || pageTitles.dashboard;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <SuperAdminSidebar activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setEditingRestaurant(null); setShowCreateHotel(false); }} />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 bg-card border-b">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div>
                  <h1 className="text-xl font-bold">{currentPage?.title}</h1>
                  <p className="text-sm text-muted-foreground">{currentPage?.description}</p>
                </div>
              </div>
            </div>
          </header>
          <main className="p-6">
            {renderContent()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default SuperAdminDashboard;
