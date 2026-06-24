import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  LayoutDashboard,
  UtensilsCrossed,
  ChefHat,
  Receipt,
  Star,
  Users,
  FileSpreadsheet,
  Eye,
  ExternalLink,
  RefreshCw,
  QrCode,
  Package,
  Sparkles,
  ClipboardList,
  Loader2,
  BarChart3,
  Megaphone,
  Ticket,
  Lock as LockIcon,
  Grid3X3,
  Heart,
  CalendarClock,
  AlertCircle,
  WifiOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { OrderHistory } from "@/components/admin/OrderHistory";
import { AdsManager } from "@/components/admin/AdsManager";
import { ReputationManager } from "@/components/admin/ReputationManager";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { ExportPanel } from "@/components/admin/ExportPanel";
import { CouponManager } from "@/components/admin/CouponManager";
import UserManagement from "@/components/admin/UserManagement";
import KitchenDashboard from "@/pages/KitchenDashboard";
import BillingCounter from "@/pages/BillingCounter";
import { OffersManager } from "@/components/admin/OffersManager";
import { MarketingAnalyticsDashboard } from "@/components/admin/MarketingAnalyticsDashboard";
import { PlatformAdsReadOnly } from "@/components/admin/PlatformAdsReadOnly";
import { PreviewTabContent } from "@/components/admin/PreviewTabContent";
import { OverviewTab } from "@/components/admin/OverviewTab";
import { MenuTab } from "@/components/admin/MenuTab";
import { QRCenter } from "@/pages/QRCenter";
import { useRestaurants, useRestaurantDetails } from "@/hooks/useRestaurant";
import { useMenuItems, useCategories } from "@/hooks/useMenuItems";
import { InventoryManager } from "@/components/admin/InventoryManager";
import { TenantThemeProvider } from "@/components/admin/TenantThemeProvider";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useFeatureGate, type FeatureKey, type LockReason } from "@/hooks/useFeatureGate";
import { FeatureLockedModal } from "@/components/admin/FeatureLockedModal";
import { useQueryClient } from "@tanstack/react-query";
import { TableManagement } from "@/components/admin/TableManagement";
import { WaiterManagementPanel } from "@/components/admin/WaiterManagementPanel";
import { CustomerManagement } from "@/components/admin/CustomerManagement";
import { SalesAnalytics } from "@/components/admin/SalesAnalytics";
import { StaffManagement } from "@/components/admin/StaffManagement";
import { ReportsPanel } from "@/components/admin/ReportsPanel";

/** Append cache-busting param to storage URLs */
function cacheBustUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    u.searchParams.set('v', String(Math.floor(Date.now() / 60000)));
    return u.toString();
  } catch {
    return url;
  }
}

// Demo restaurant ID - fallback if no restaurant in DB
const DEMO_RESTAURANT_ID = "00000000-0000-0000-0000-000000000001";

const mainTabs = [
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "orders", label: "Orders", icon: ClipboardList },
  { value: "tables", label: "Tables", icon: Grid3X3 },
  { value: "qr-manager", label: "QR Manager", icon: QrCode },
  { value: "menu", label: "Menu", icon: UtensilsCrossed },
  { value: "kitchen", label: "Kitchen", icon: ChefHat },
  { value: "billing", label: "Billing", icon: Receipt },
  { value: "inventory", label: "Inventory", icon: Package },
  { value: "waiters", label: "Waiters", icon: Users },
  { value: "staff", label: "Staff", icon: CalendarClock },
  { value: "analytics", label: "Analytics", icon: BarChart3 },
  { value: "reports", label: "Reports", icon: FileSpreadsheet },
  { value: "marketing", label: "Marketing", icon: Sparkles },
  { value: "settings", label: "Settings", icon: Settings },
];



const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const { user, role, restaurantId: authRestaurantId, loading: authLoading } = useAuth();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wsStatus, setWsStatus] = useState<"connected" | "disconnected">("connected");

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({ title: "Back Online", description: "Your internet connection has been restored." });
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast({ title: "Connection Lost", description: "You are currently working offline.", variant: "destructive" });
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  useEffect(() => {
    if (activeTab === "preview") {
      setPreviewRefreshKey(k => k + 1);
    }
  }, [activeTab]);

  const { data: restaurants = [], isLoading: restaurantsLoading } = useRestaurants();
  const restaurantId = authRestaurantId || restaurants[0]?.id || DEMO_RESTAURANT_ID;
  
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);
  
  const { data: restaurant } = useRestaurantDetails(restaurantId);
  const { canAccess, isLocked } = useFeatureGate(
    restaurant?.subscription_tier,
    restaurant?.ads_enabled,
    (restaurant as any)?.feature_toggles
  );

  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [lockModalFeature, setLockModalFeature] = useState("");
  const [lockModalReason, setLockModalReason] = useState<LockReason>(null);

  const handleTabChange = (tabValue: string) => {
    const reason = isLocked(tabValue as FeatureKey);
    if (reason) {
      const tab = mainTabs.find(t => t.value === tabValue);
      setLockModalFeature(tab?.label || tabValue);
      setLockModalReason(reason);
      setLockModalOpen(true);
    } else {
      setActiveTab(tabValue);
    }
  };

  useEffect(() => {
    if (!restaurantId) return;
    const channel = supabase
      .channel(`admin-preview-sync-${restaurantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants', filter: `id=eq.${restaurantId}` },
        () => { setPreviewRefreshKey(k => k + 1); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers', filter: `restaurant_id=eq.${restaurantId}` },
        () => { setPreviewRefreshKey(k => k + 1); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items', filter: `restaurant_id=eq.${restaurantId}` },
        () => { setPreviewRefreshKey(k => k + 1); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurantId]);

  useEffect(() => {
    if (restaurant && !(restaurant as any).onboarding_completed && role === 'restaurant_admin') {
      navigate('/admin/onboarding');
    }
  }, [restaurant, role, navigate]);

  const { data: menuItems = [] } = useMenuItems(restaurantId);
  const { data: categories = [] } = useCategories(restaurantId);
  const { data: orders = [] } = useOrders(restaurantId);

  const currencySymbol = restaurant?.currency || "₹";
  const restaurantName = restaurant?.name || "ZAPPY";

  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`admin-realtime-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurants', filter: `id=eq.${restaurantId}` },
        () => { queryClient.invalidateQueries({ queryKey: ["restaurant", restaurantId] }); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items', filter: `restaurant_id=eq.${restaurantId}` },
        () => { queryClient.invalidateQueries({ queryKey: ["menu_items", restaurantId] }); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
        () => { 
          queryClient.invalidateQueries({ queryKey: ["orders", restaurantId] });
          toast({ title: "New Order!", description: "A new order has been placed." });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tables', filter: `restaurant_id=eq.${restaurantId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["tables", restaurantId] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'table_sessions', filter: `restaurant_id=eq.${restaurantId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["table_sessions"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'seat_occupancy', filter: `restaurant_id=eq.${restaurantId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["seat-occupancy"] });
          queryClient.invalidateQueries({ queryKey: ["seat-occupancy-all"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employee_assignments', filter: `restaurant_id=eq.${restaurantId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["employee_assignments", restaurantId] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'waiter_calls', filter: `restaurant_id=eq.${restaurantId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["waiter_calls", restaurantId] });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setWsStatus("connected");
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setWsStatus("disconnected");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);

  if (restaurantsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading restaurant...</p>
        </div>
      </div>
    );
  }

  const customerPreviewUrl = `/order?r=${restaurantId}`;

  return (
    <TenantThemeProvider primaryColor={restaurant?.primary_color} secondaryColor={restaurant?.secondary_color}>
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} onboardingCompleted={(restaurant as any)?.onboarding_completed ?? true} restaurantName={(restaurant as any)?.name} restaurantLogo={cacheBustUrl((restaurant as any)?.logo_url)} subscriptionTier={restaurant?.subscription_tier} adsEnabled={restaurant?.ads_enabled} featureToggles={(restaurant as any)?.feature_toggles} />

        <SidebarInset className="flex-1">
          <AdminHeader
            restaurantName={restaurantName}
            primaryColor={restaurant?.primary_color || undefined}
            branding={(restaurant?.settings as any)?.branding}
            logoUrl={cacheBustUrl(restaurant?.logo_url)}
          />

          {!isOnline && (
            <div className="bg-destructive text-destructive-foreground px-6 py-2 flex items-center gap-2 text-xs font-semibold animate-pulse">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>🔌 You are currently working offline. Real-time updates and active syncing are suspended until connection returns.</span>
            </div>
          )}

          {isOnline && wsStatus === "disconnected" && (
            <div className="bg-amber-500 text-white px-6 py-2 flex items-center gap-2 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
              <span>⚠️ Real-time connection interrupted. Attempting to re-establish live WebSocket listener channel...</span>
            </div>
          )}



          <main className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === "dashboard" && (
                <OverviewTab
                  orders={orders}
                  currencySymbol={currencySymbol}
                  user={user}
                  restaurant={restaurant}
                  role={role}
                  restaurantId={restaurantId}
                  menuItems={menuItems}
                  onViewAllOrders={() => setActiveTab("orders")}
                  restaurantsLoading={restaurantsLoading}
                />
              )}

              {activeTab === "menu" && (
                <MenuTab
                  restaurantId={restaurantId}
                  menuItems={menuItems}
                  categories={categories}
                  currencySymbol={currencySymbol}
                />
              )}

              {activeTab === "orders" && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <OrderHistory 
                    restaurantId={restaurantId} 
                    currencySymbol={currencySymbol}
                  />
                </motion.div>
              )}

              {activeTab === "tables" && (
                <motion.div
                  key="tables"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <TableManagement restaurantId={restaurantId} />
                </motion.div>
              )}


              {activeTab === "waiters" && (
                <motion.div
                  key="waiters"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <WaiterManagementPanel restaurantId={restaurantId} />
                </motion.div>
              )}

              {activeTab === "kitchen" && (
                <motion.div
                  key="kitchen"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="-m-6"
                >
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
                    <h3 className="text-sm font-medium text-muted-foreground">Kitchen Display</h3>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewRefreshKey(k => k + 1)} title="Refresh">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(`/kitchen?r=${restaurantId}`, '_blank')} title="Open in new window">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="h-[calc(100vh-220px)] overflow-auto">
                    <KitchenDashboard key={previewRefreshKey} embedded restaurantId={restaurantId} />
                  </div>
                </motion.div>
              )}

              {activeTab === "billing" && (
                <motion.div
                  key="billing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="-m-6"
                >
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
                    <h3 className="text-sm font-medium text-muted-foreground">Billing Counter</h3>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewRefreshKey(k => k + 1)} title="Refresh">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(`/billing?r=${restaurantId}`, '_blank')} title="Open in new window">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="h-[calc(100vh-220px)] overflow-auto">
                    <BillingCounter key={previewRefreshKey} embedded restaurantId={restaurantId} />
                  </div>
                </motion.div>
              )}

              {activeTab === "marketing" && (
                <motion.div
                  key="marketing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Marketing Center</h2>
                      <p className="text-sm text-muted-foreground">Manage your custom banner advertisements and promotional spaces.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <AdsManager restaurantId={restaurantId} />
                  </div>
                </motion.div>
              )}

              {activeTab === "reviews" && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ReputationManager restaurantId={restaurantId} />
                </motion.div>
              )}

              {activeTab === "exports" && (
                <motion.div
                  key="exports"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ExportPanel restaurantId={restaurantId} />
                </motion.div>
              )}

              {activeTab === "users" && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <UserManagement />
                </motion.div>
              )}

              {activeTab === "inventory" && (
                <motion.div
                  key="inventory"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <InventoryManager restaurantId={restaurantId} />
                </motion.div>
              )}

              {activeTab === "customers" && (
                <motion.div
                  key="customers"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <CustomerManagement restaurantId={restaurantId} />
                </motion.div>
              )}

              {activeTab === "analytics" && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <SalesAnalytics restaurantId={restaurantId} />
                </motion.div>
              )}

              {activeTab === "staff" && (
                <motion.div
                  key="staff"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <StaffManagement restaurantId={restaurantId} />
                </motion.div>
              )}

              {activeTab === "reports" && (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ReportsPanel restaurantId={restaurantId} />
                </motion.div>
              )}

              {activeTab === "preview" && (
                <PreviewTabContent customerPreviewUrl={customerPreviewUrl} restaurantId={restaurantId} externalRefreshKey={previewRefreshKey} />
              )}

              {activeTab === "qr-manager" && (
                <motion.div
                  key="qr"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <QRCenter restaurantId={restaurantId} />
                </motion.div>
              )}

              {activeTab === "settings" && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <SettingsPanel restaurantId={restaurantId} />
                </motion.div>
              )}
            </AnimatePresence>

            <FeatureLockedModal
              open={lockModalOpen}
              onOpenChange={setLockModalOpen}
              featureName={lockModalFeature}
              lockReason={lockModalReason}
              onGoToSettings={() => setActiveTab("settings")}
            />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
    </TenantThemeProvider>
  );
};

export default AdminDashboard;
