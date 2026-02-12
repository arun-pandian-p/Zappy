import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Plus,
  Search,
  Check,
  X,
  Loader2,
  Power,
  LayoutGrid,
  List,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useRestaurants, useCreateRestaurant, useUpdateRestaurant, useDeleteRestaurant } from '@/hooks/useRestaurant';
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
import { PlatformSettings } from '@/components/superadmin/PlatformSettings';
import { DefaultTaxSettings } from '@/components/superadmin/DefaultTaxSettings';
import { EmailTemplateManager } from '@/components/superadmin/EmailTemplateManager';
import { SystemLogs } from '@/components/superadmin/SystemLogs';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import UserManagement from '@/components/admin/UserManagement';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import type { Tables } from '@/integrations/supabase/types';

type Restaurant = Tables<"restaurants">;

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCreateHotel, setShowCreateHotel] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [tenantViewMode, setTenantViewMode] = useState<'table' | 'grid'>('table');

  const { data: restaurants = [], isLoading } = useRestaurants();
  const createRestaurant = useCreateRestaurant();
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
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['staff-members'] });
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

  if (role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Power className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You need Super Admin privileges.</p>
            <Button onClick={() => navigate('/admin')}>Go to Admin Dashboard</Button>
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
            <TenantStats restaurants={restaurants} totalRevenue={0} currencySymbol="₹" />
            <MonthlyTrendChart restaurants={restaurants} currencySymbol="₹" months={6} />
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
                  onToggleActive={handleToggleActive}
                  onChangeTier={handleChangeTier}
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
            <MonthlyTrendChart restaurants={restaurants} currencySymbol="₹" months={6} />
            <TenantTable
              restaurants={restaurants}
              onToggleActive={handleToggleActive}
              onChangeTier={handleChangeTier}
              onViewDetails={handleViewDetails}
            />
          </div>
        );

      case 'users':
        return <UserManagement />;

      case 'plans':
        return <SubscriptionPlansManager />;

      case 'ads':
        return <PlatformAdsManager />;

      case 'settings':
        return (
          <Tabs defaultValue="branding" className="space-y-4">
            <TabsList>
              <TabsTrigger value="branding">Platform Branding</TabsTrigger>
              <TabsTrigger value="tax">Default Tax Config</TabsTrigger>
              <TabsTrigger value="emails">Email Templates</TabsTrigger>
            </TabsList>
            <TabsContent value="branding"><PlatformSettings /></TabsContent>
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
    analytics: { title: 'Analytics', description: 'Revenue and performance trends' },
    users: { title: 'User Management', description: 'Manage all staff across restaurants' },
    plans: { title: 'Subscription Plans', description: 'Manage platform subscription tiers' },
    ads: { title: 'Platform Ads', description: 'Manage promotional advertisements' },
    settings: { title: 'Settings', description: 'Platform configuration' },
    logs: { title: 'System Logs', description: 'Audit trail of platform actions' },
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
                  <h1 className="text-xl font-bold">{currentPage.title}</h1>
                  <p className="text-sm text-muted-foreground">{currentPage.description}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                Back to Admin
              </Button>
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
