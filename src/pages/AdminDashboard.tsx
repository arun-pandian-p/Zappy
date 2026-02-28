import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  LayoutDashboard,
  UtensilsCrossed,
  
  Plus,
  Trash2,
  Wallet,
  ChefHat,
  Utensils,
  Save,
  ClipboardList,
  Receipt,
  Megaphone,
  Star,
  Users,
  Loader2,
  Download,
  Edit2,
  X,
  Ticket,
  FileSpreadsheet,
  Eye,
  ExternalLink,
  Gift,
  RefreshCw,
  Smartphone,
  Tablet,
  Monitor,
  Globe,
  QrCode,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatCard } from "@/components/admin/StatCard";
import { RecentOrdersTable } from "@/components/admin/RecentOrdersTable";
import { MenuPreviewCard } from "@/components/admin/MenuPreviewCard";

import { OrderHistory } from "@/components/admin/OrderHistory";
import { AdsManager } from "@/components/admin/AdsManager";
import { FeedbackManager } from "@/components/admin/FeedbackManager";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ExportPanel } from "@/components/admin/ExportPanel";
import { CouponManager } from "@/components/admin/CouponManager";
import { TableSessionTimers } from "@/components/admin/TableSessionTimers";
import UserManagement from "@/components/admin/UserManagement";
import { RevenueChart } from "@/components/analytics/RevenueChart";
import { DashboardStats } from "@/components/analytics/DashboardStats";
import { OrdersTable } from "@/components/analytics/OrdersTable";
import { RevenueTrends } from "@/components/analytics/RevenueTrends";
import KitchenDashboard from "@/pages/KitchenDashboard";
import BillingCounter from "@/pages/BillingCounter";
import { OffersManager } from "@/components/admin/OffersManager";
import { MarketResearch } from "@/components/admin/MarketResearch";
import { CustomerBehaviorPanel } from "@/components/analytics/CustomerBehaviorPanel";
import { QRCodeManager } from "@/components/admin/QRCodeManager";
import { QRScanAnalytics } from "@/components/analytics/QRScanAnalytics";
import { useRestaurants, useRestaurant } from "@/hooks/useRestaurant";
import { 
  useMenuItems, 
  useCategories, 
  useCreateMenuItem, 
  useDeleteMenuItem, 
  useToggleMenuItemAvailability,
  type MenuItem,
  type Category,
} from "@/hooks/useMenuItems";
import { EditMenuItemDialog } from "@/components/admin/EditMenuItemDialog";
import { InventoryManager } from "@/components/admin/InventoryManager";
import { Package } from "lucide-react";
import { useTables } from "@/hooks/useTables";
import { useOrders } from "@/hooks/useOrders";
import { useInvoiceStats } from "@/hooks/useInvoices";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useFeatureGate, type FeatureKey, type LockReason } from "@/hooks/useFeatureGate";
import { FeatureLockedModal } from "@/components/admin/FeatureLockedModal";
import { Lock } from "lucide-react";

// Demo restaurant ID - fallback if no restaurant in DB
const DEMO_RESTAURANT_ID = "00000000-0000-0000-0000-000000000001";

type DeviceType = "mobile" | "tablet" | "desktop";
type PreviewMode = "customer" | "kitchen" | "billing";

function PreviewTabContent({ customerPreviewUrl, restaurantId, externalRefreshKey }: { customerPreviewUrl: string; restaurantId: string; externalRefreshKey: number }) {
  const [device, setDevice] = useState<DeviceType>("mobile");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("customer");
  const [refreshKey, setRefreshKey] = useState(0);
  const combinedKey = `${previewMode}-${refreshKey}-${externalRefreshKey}`;

  const deviceConfig = {
    mobile: { width: 375, height: 812, label: "Mobile" },
    tablet: { width: 768, height: 1024, label: "Tablet" },
    desktop: { width: "100%" as const, height: "100%" as const, label: "Desktop" },
  };

  const previewModes = [
    { value: "customer" as const, label: "Customer Menu", icon: Eye, description: "Menu & ordering flow" },
    { value: "kitchen" as const, label: "Kitchen Display", icon: ChefHat, description: "KDS order management" },
    { value: "billing" as const, label: "Billing Counter", icon: Receipt, description: "POS & invoicing" },
  ];

  const getPreviewUrl = () => {
    switch (previewMode) {
      case "kitchen":
        return `/kitchen?r=${restaurantId}&preview=true`;
      case "billing":
        return `/billing?r=${restaurantId}&preview=true`;
      default:
        return customerPreviewUrl;
    }
  };

  // Kitchen & billing are better previewed at tablet/desktop
  const effectiveDevice = previewMode !== "customer" && device === "mobile" ? "tablet" : device;

  return (
    <motion.div
      key="preview"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {/* Sticky Header + Mode Tabs */}
      <div className="sticky top-0 z-30 bg-background pb-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
          <div>
            <h2 className="text-xl font-bold">Site Preview</h2>
            <p className="text-sm text-muted-foreground">Preview all customer & staff interfaces</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Device selector */}
            <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
              <Button variant={effectiveDevice === "mobile" ? "default" : "ghost"} size="sm" onClick={() => setDevice("mobile")}>
                <Smartphone className="w-4 h-4" />
              </Button>
              <Button variant={effectiveDevice === "tablet" ? "default" : "ghost"} size="sm" onClick={() => setDevice("tablet")}>
                <Tablet className="w-4 h-4" />
              </Button>
              <Button variant={effectiveDevice === "desktop" ? "default" : "ghost"} size="sm" onClick={() => setDevice("desktop")}>
                <Monitor className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setRefreshKey(k => k + 1)}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(getPreviewUrl(), '_blank')}>
              <ExternalLink className="w-4 h-4 mr-1" />
              Open
            </Button>
          </div>
        </div>

        {/* Preview Mode Tabs */}
        <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-1.5">
          {previewModes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setPreviewMode(mode.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                previewMode === mode.value
                  ? "bg-background shadow-sm text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <mode.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex justify-center bg-muted/30 rounded-xl border p-4 mt-4" style={{ minHeight: '80vh' }}>
        <div
          className={`bg-background rounded-2xl shadow-2xl border-4 border-foreground/10 overflow-hidden transition-all duration-300 ${
            effectiveDevice === "desktop" ? "w-full" : ""
          }`}
          style={
            effectiveDevice !== "desktop"
              ? { width: deviceConfig[effectiveDevice].width, height: deviceConfig[effectiveDevice].height, maxHeight: '78vh' }
              : { height: '78vh', width: '100%' }
          }
        >
          <iframe
            key={combinedKey}
            src={getPreviewUrl()}
            className="w-full h-full border-0"
            title={`${previewModes.find(m => m.value === previewMode)?.label} Preview`}
          />
        </div>
      </div>
    </motion.div>
  );
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const { user, role, restaurantId: authRestaurantId, loading: authLoading } = useAuth();

  // Auto-refresh preview when switching to preview tab
  useEffect(() => {
    if (activeTab === "preview") {
      setPreviewRefreshKey(k => k + 1);
    }
  }, [activeTab]);


  // Use auth restaurant context first, then fallback to DB query
  const { data: restaurants = [], isLoading: restaurantsLoading } = useRestaurants();
  const restaurantId = authRestaurantId || restaurants[0]?.id || DEMO_RESTAURANT_ID;
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);
  
  // Fetch live data
  const { data: restaurant } = useRestaurant(restaurantId);
  const { canAccess, isLocked } = useFeatureGate(
    restaurant?.subscription_tier,
    restaurant?.ads_enabled
  );

  // Feature lock modal state
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

  // Realtime: bump preview key when restaurant/offers/menu change
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

  // Redirect if onboarding not completed
  useEffect(() => {
    if (restaurant && !(restaurant as any).onboarding_completed && role === 'restaurant_admin') {
      navigate('/admin/onboarding');
    }
  }, [restaurant, role, navigate]);
  const { data: menuItems = [], isLoading: menuLoading } = useMenuItems(restaurantId);
  const { data: categories = [] } = useCategories(restaurantId);
  const { data: tables = [], isLoading: tablesLoading } = useTables(restaurantId);
  const { data: orders = [] } = useOrders(restaurantId);
  const { data: invoiceStats } = useInvoiceStats(restaurantId);
  

  // Edit menu item dialog state
  const [editingItem, setEditingItem] = useState<(MenuItem & { category?: Pick<Category, "id" | "name"> | null }) | null>(null);

  // New item form state
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    category: "Starters",
    image_url: "",
    is_vegetarian: false,
    prep_time_minutes: "15",
  });

  // Restaurant settings with defaults
  const currencySymbol = restaurant?.currency || "₹";
  const restaurantName = restaurant?.name || "QR Dine Pro";

  // Mutations
  const createMenuItem = useCreateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();
  const toggleAvailability = useToggleMenuItemAvailability();

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Find category ID
    const category = categories.find(c => c.name === newItem.category);

    try {
      await createMenuItem.mutateAsync({
        restaurant_id: restaurantId,
        name: newItem.name,
        description: newItem.description || undefined,
        price: parseFloat(newItem.price),
        category_id: category?.id,
        image_url: newItem.image_url || undefined,
        is_vegetarian: newItem.is_vegetarian,
        prep_time_minutes: parseInt(newItem.prep_time_minutes) || 15,
        is_available: true,
      });
      
      toast({
        title: "Item Added",
        description: `${newItem.name} has been added to the menu.`,
      });
      
      setNewItem({
        name: "",
        description: "",
        price: "",
        category: categories[0]?.name || "Starters",
        image_url: "",
        is_vegetarian: false,
        prep_time_minutes: "15",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add menu item.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    try {
      await deleteMenuItem.mutateAsync({ id, restaurantId });
      toast({
        title: "Item Deleted",
        description: "Menu item has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item.",
        variant: "destructive",
      });
    }
  };

  const handleToggleAvailability = async (id: string, currentValue: boolean) => {
    try {
      await toggleAvailability.mutateAsync({ id, isAvailable: !currentValue });
      toast({
        title: "Availability Updated",
        description: `Item is now ${!currentValue ? 'available' : 'unavailable'}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update availability.",
        variant: "destructive",
      });
    }
  };


  // Computed stats from live data
  const completedOrders = orders.filter((o) => o.status === "completed");
  const todayRevenue = invoiceStats?.totalRevenue || completedOrders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0);
  const activeTables = tables.filter((t) => t.status !== "available").length;

  // Transform orders for table display
  const recentOrders = useMemo(() => {
    return orders.slice(0, 5).map((order) => ({
      id: order.id,
      tableNumber: order.table?.table_number || "N/A",
      items: order.order_items?.map((item) => ({
        name: item.name,
        quantity: item.quantity,
      })) || [],
      status: order.status as "pending" | "preparing" | "ready" | "delivered" | "completed",
      amount: Number(order.total_amount || 0),
    }));
  }, [orders]);

  

  // Loading state
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

  // Tab triggers for top navigation

  const mainTabs = [
    { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { value: "menu", label: "Menu", icon: UtensilsCrossed },
    
    { value: "orders", label: "Orders", icon: ClipboardList },
    { value: "kitchen", label: "Kitchen", icon: ChefHat },
    { value: "billing", label: "Billing", icon: Receipt },
    { value: "coupons", label: "Coupons", icon: Ticket },
    { value: "ads", label: "Ads", icon: Megaphone },
    { value: "reviews", label: "Reviews", icon: Star },
    { value: "users", label: "Users", icon: Users },
    { value: "inventory", label: "Inventory", icon: Package },
    { value: "exports", label: "Exports", icon: FileSpreadsheet },
    { value: "offers", label: "Offers", icon: Gift },
    { value: "qr-manager", label: "QR Manager", icon: QrCode },
    { value: "research", label: "Research", icon: Globe },
    { value: "preview", label: "Preview Site", icon: Eye },
    { value: "settings", label: "Settings", icon: Settings },
  ];

  const customerPreviewUrl = `/order?r=${restaurantId}`;

  return (
    <SidebarProvider defaultOpen>
      <div className="theme-tenant-admin flex min-h-screen w-full bg-background">
        <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} onboardingCompleted={(restaurant as any)?.onboarding_completed ?? true} restaurantName={(restaurant as any)?.name} restaurantLogo={(restaurant as any)?.logo_url} subscriptionTier={restaurant?.subscription_tier} adsEnabled={restaurant?.ads_enabled} />

        <SidebarInset className="flex-1">
          <AdminHeader
            restaurantName={restaurantName}
            primaryColor={restaurant?.primary_color || undefined}
            branding={(restaurant?.settings as any)?.branding}
            adminAvatar={(restaurant?.settings as any)?.admin_avatar}
            adminDisplayName={(restaurant?.settings as any)?.admin_display_name}
          />

          {/* Tab Navigation */}
          <div className="border-b bg-card overflow-x-auto">
            <div className="px-6">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="h-12 bg-transparent border-0 p-0 gap-4 flex-wrap">
                  {mainTabs.map((tab) => {
                    const reason = isLocked(tab.value as FeatureKey);
                    const locked = !!reason;
                    return (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className={cn(
                          "data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-0",
                          locked && "opacity-50"
                        )}
                      >
                        <tab.icon className="w-4 h-4 mr-2" />
                        {tab.label}
                        {locked && <Lock className="w-3 h-3 ml-1 opacity-60" />}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Main Content */}
          <main className="p-6">
            <AnimatePresence mode="wait">
              {/* Dashboard Tab */}
              {activeTab === "dashboard" && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Enhanced Stats Row */}
                  <DashboardStats orders={orders} currencySymbol={currencySymbol} />

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RevenueChart orders={orders} currencySymbol={currencySymbol} days={7} />
                    <RevenueTrends orders={orders} currencySymbol={currencySymbol} days={7} />
                  </div>

                  {/* Customer Behavior */}
                  <CustomerBehaviorPanel restaurantId={restaurantId} />

                  {/* Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Orders - 2 columns */}
                    <div className="lg:col-span-2">
                      <OrdersTable
                        orders={orders}
                        currencySymbol={currencySymbol}
                        onViewAll={() => setActiveTab("orders")}
                        limit={5}
                        showFilters={false}
                      />
                    </div>

                    {/* Right Panel - QR & Menu Preview */}
                    <div className="space-y-6">
                      {/* Table Session Timers */}
                      <TableSessionTimers restaurantId={restaurantId} />


                      {/* Mini Menu Preview */}
                      <Card className="border-0 shadow-md">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-semibold">
                            Popular Items
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-3">
                            {menuItems.slice(0, 2).map((item, index) => (
                              <MenuPreviewCard
                                key={item.id}
                                id={item.id}
                                name={item.name}
                                price={item.price}
                                imageUrl={item.image_url}
                                isVegetarian={item.is_vegetarian}
                                currencySymbol={currencySymbol}
                                index={index}
                              />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Menu Tab */}
              {activeTab === "menu" && (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Add New Item */}
                    <Card className="border-0 shadow-md">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Plus className="w-5 h-5" />
                          Add Menu Item
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Name *</Label>
                          <Input
                            value={newItem.name}
                            onChange={(e) =>
                              setNewItem({ ...newItem, name: e.target.value })
                            }
                            placeholder="Item name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={newItem.description}
                            onChange={(e) =>
                              setNewItem({ ...newItem, description: e.target.value })
                            }
                            placeholder="Item description"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Price *</Label>
                            <Input
                              type="number"
                              value={newItem.price}
                              onChange={(e) =>
                                setNewItem({ ...newItem, price: e.target.value })
                              }
                              placeholder="0.00"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Prep Time (min)</Label>
                            <Input
                              type="number"
                              value={newItem.prep_time_minutes}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  prep_time_minutes: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select
                            value={newItem.category}
                            onValueChange={(v) =>
                              setNewItem({ ...newItem, category: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.name}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Image</Label>
                          <ImageUpload
                            currentImageUrl={newItem.image_url}
                            onImageUploaded={(url) => setNewItem({ ...newItem, image_url: url })}
                            restaurantId={restaurantId}
                            folder="menu"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={newItem.is_vegetarian}
                            onCheckedChange={(v) =>
                              setNewItem({ ...newItem, is_vegetarian: v })
                            }
                          />
                          <Label>Vegetarian</Label>
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={handleAddItem}
                          disabled={createMenuItem.isPending}
                        >
                          {createMenuItem.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4 mr-2" />
                          )}
                          Add Item
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Category Manager */}
                    <CategoryManager restaurantId={restaurantId} />
                    {/* Menu Items Grid */}
                    <div className="lg:col-span-2">
                      <Card className="border-0 shadow-md">
                        <CardHeader>
                          <CardTitle>Menu Items ({menuItems.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                            {menuItems.map((item, index) => (
                              <motion.div
                                key={item.id}
                                layout
                                className="relative"
                              >
                                <MenuPreviewCard
                                  id={item.id}
                                  name={item.name}
                                  description={item.description}
                                  price={item.price}
                                  imageUrl={item.image_url}
                                  isVegetarian={item.is_vegetarian}
                                  currencySymbol={currencySymbol}
                                  index={index}
                                />
                                <div className="absolute top-2 right-2 flex gap-1">
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="w-7 h-7"
                                    onClick={() => setEditingItem(item as any)}
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                <Switch
                                    checked={item.is_available}
                                    onCheckedChange={() =>
                                      handleToggleAvailability(item.id, item.is_available ?? true)
                                    }
                                    className="scale-75"
                                  />
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="w-7 h-7"
                                    onClick={() => handleDeleteItem(item.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                                {!item.is_available && (
                                  <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                                    <Badge variant="secondary">Unavailable</Badge>
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  {/* Edit Menu Item Dialog */}
                  {editingItem && (
                    <EditMenuItemDialog
                      open={!!editingItem}
                      onOpenChange={(open) => !open && setEditingItem(null)}
                      item={editingItem}
                      categories={categories}
                      restaurantId={restaurantId}
                    />
                  )}
                </motion.div>
              )}


              {/* Orders Tab */}
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

              {/* Kitchen Tab - Embedded KDS */}
              {activeTab === "kitchen" && (
                <motion.div
                  key="kitchen"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="-m-6"
                >
                  <div className="h-[calc(100vh-180px)] overflow-auto">
                    <KitchenDashboard embedded restaurantId={restaurantId} />
                  </div>
                </motion.div>
              )}

              {/* Billing Tab - Embedded Billing */}
              {activeTab === "billing" && (
                <motion.div
                  key="billing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="-m-6"
                >
                  <div className="h-[calc(100vh-180px)] overflow-auto">
                    <BillingCounter embedded restaurantId={restaurantId} />
                  </div>
                </motion.div>
              )}

              {/* Coupons Tab */}
              {activeTab === "coupons" && (
                <motion.div
                  key="coupons"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <CouponManager restaurantId={restaurantId} />
                </motion.div>
              )}

              {/* Ads Tab */}
              {activeTab === "ads" && (
                <motion.div
                  key="ads"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AdsManager restaurantId={restaurantId} />
                </motion.div>
              )}

              {/* Reviews Tab */}
              {activeTab === "reviews" && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <FeedbackManager restaurantId={restaurantId} />
                </motion.div>
              )}

              {/* Exports Tab */}
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

              {/* Users Tab */}
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

              {/* Inventory Tab */}
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

              {/* Offers Tab */}
              {activeTab === "offers" && (
                <motion.div
                  key="offers"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <OffersManager restaurantId={restaurantId} />
                </motion.div>
              )}

              {/* Preview Tab */}
              {activeTab === "preview" && (
                <PreviewTabContent customerPreviewUrl={customerPreviewUrl} restaurantId={restaurantId} externalRefreshKey={previewRefreshKey} />
              )}

              {/* QR Manager Tab */}
              {activeTab === "qr-manager" && (
                <motion.div
                  key="qr-manager"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <QRCodeManager restaurantId={restaurantId} />
                  <QRScanAnalytics restaurantId={restaurantId} />
                </motion.div>
              )}

              {/* Market Research Tab */}
              {activeTab === "research" && (
                <motion.div
                  key="research"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <MarketResearch />
                </motion.div>
              )}

              {/* Settings Tab */}
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
  );
};

export default AdminDashboard;
