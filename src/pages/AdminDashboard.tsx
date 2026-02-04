import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  LayoutDashboard,
  UtensilsCrossed,
  Grid3X3,
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
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  categories as mockCategories,
  MenuItem,
} from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRCodeSVG } from "qrcode.react";
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
import { QuickQRSection } from "@/components/admin/QuickQRSection";
import { OrderHistory } from "@/components/admin/OrderHistory";
import { AdsManager } from "@/components/admin/AdsManager";
import { FeedbackManager } from "@/components/admin/FeedbackManager";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import KitchenDashboard from "@/pages/KitchenDashboard";
import BillingCounter from "@/pages/BillingCounter";
import { useRestaurants, useRestaurant } from "@/hooks/useRestaurant";
import { useMenuItems, useCategories } from "@/hooks/useMenuItems";
import { useTables } from "@/hooks/useTables";
import { useOrders } from "@/hooks/useOrders";
import { useInvoiceStats } from "@/hooks/useInvoices";

// Demo restaurant ID - fallback if no restaurant in DB
const DEMO_RESTAURANT_ID = "00000000-0000-0000-0000-000000000001";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Auto-detect restaurant
  const { data: restaurants = [], isLoading: restaurantsLoading } = useRestaurants();
  const restaurantId = restaurants[0]?.id || DEMO_RESTAURANT_ID;
  
  // Fetch live data
  const { data: restaurant } = useRestaurant(restaurantId);
  const { data: menuItems = [], isLoading: menuLoading } = useMenuItems(restaurantId);
  const { data: categories = [] } = useCategories(restaurantId);
  const { data: tables = [], isLoading: tablesLoading } = useTables(restaurantId);
  const { data: orders = [] } = useOrders(restaurantId);
  const { data: invoiceStats } = useInvoiceStats(restaurantId);
  
  const [selectedTableId, setSelectedTableId] = useState<string>("");

  // Set first table when tables load
  useEffect(() => {
    if (tables.length > 0 && !selectedTableId) {
      setSelectedTableId(tables[0].id);
    }
  }, [tables, selectedTableId]);

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

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // TODO: Integrate with useCreateMenuItem hook
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
  };

  const handleDeleteItem = (id: string) => {
    // TODO: Integrate with useDeleteMenuItem hook
    toast({
      title: "Item Deleted",
      description: "Menu item has been removed.",
    });
  };

  const handleToggleAvailability = (id: string) => {
    // TODO: Integrate with useToggleMenuItemAvailability hook
    toast({
      title: "Availability Updated",
      description: "Item availability has been toggled.",
    });
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

  const selectedTable = tables.find((t) => t.id === selectedTableId);

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
    { value: "tables", label: "Tables & QR", icon: Grid3X3 },
    { value: "orders", label: "Orders", icon: ClipboardList },
    { value: "kitchen", label: "Kitchen", icon: ChefHat },
    { value: "billing", label: "Billing", icon: Receipt },
    { value: "ads", label: "Ads", icon: Megaphone },
    { value: "reviews", label: "Reviews", icon: Star },
    { value: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <SidebarInset className="flex-1">
          <AdminHeader restaurantName={restaurantName} />

          {/* Tab Navigation */}
          <div className="border-b bg-card overflow-x-auto">
            <div className="px-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="h-12 bg-transparent border-0 p-0 gap-4 flex-wrap">
                  {mainTabs.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-0"
                    >
                      <tab.icon className="w-4 h-4 mr-2" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
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
                >
                  {/* Stats Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <StatCard
                      label="Today's Revenue"
                      value={`${currencySymbol}${todayRevenue}`}
                      icon={Wallet}
                      iconColor="orange"
                      index={0}
                    />
                    <StatCard
                      label="Orders Today"
                      value={orders.length}
                      icon={ChefHat}
                      iconColor="blue"
                      index={1}
                    />
                    <StatCard
                      label="Active Tables"
                      value={activeTables}
                      icon={Utensils}
                      iconColor="orange"
                      index={2}
                    />
                  </div>

                  {/* Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Orders - 2 columns */}
                    <div className="lg:col-span-2">
                      <RecentOrdersTable
                        orders={recentOrders}
                        currencySymbol={currencySymbol}
                        onViewAll={() => setActiveTab("orders")}
                      />
                    </div>

                    {/* Right Panel - QR & Menu Preview */}
                    <div className="space-y-6">
                      <QuickQRSection
                        tables={tables.map((t) => ({
                          id: t.id,
                          table_number: t.table_number,
                        }))}
                        selectedTableId={selectedTableId}
                        onTableChange={setSelectedTableId}
                      />

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
                          <Label>Image URL</Label>
                          <Input
                            value={newItem.image_url}
                            onChange={(e) =>
                              setNewItem({ ...newItem, image_url: e.target.value })
                            }
                            placeholder="https://..."
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
                        <Button className="w-full" onClick={handleAddItem}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Item
                        </Button>
                      </CardContent>
                    </Card>

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
                                  <Switch
                                    checked={item.is_available}
                                    onCheckedChange={() =>
                                      handleToggleAvailability(item.id)
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
                </motion.div>
              )}

              {/* Tables & QR Tab */}
              {activeTab === "tables" && (
                <motion.div
                  key="tables"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tables List */}
                    <Card className="border-0 shadow-md">
                      <CardHeader>
                        <CardTitle>Restaurant Tables</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {tables.map((table) => (
                            <Button
                              key={table.id}
                              variant={
                                selectedTableId === table.id ? "default" : "outline"
                              }
                              className="h-auto py-4 flex-col"
                              onClick={() => setSelectedTableId(table.id)}
                            >
                              <span className="font-bold text-lg">
                                {table.table_number}
                              </span>
                              <span className="text-xs opacity-70">
                                {table.capacity} seats
                              </span>
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* QR Code Generator */}
                    <Card className="border-0 shadow-md">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Grid3X3 className="w-5 h-5" />
                          QR Code - {selectedTable?.table_number}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center">
                        {selectedTable && (
                          <>
                            <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                              <QRCodeSVG
                                value={`${window.location.origin}/order?r=${DEMO_RESTAURANT_ID}&table=${selectedTable.table_number}`}
                                size={200}
                                level="H"
                              />
                            </div>
                            <p className="text-sm text-muted-foreground text-center mb-4">
                              Scan to order from {selectedTable.table_number}
                            </p>
                            <Button variant="outline">Download QR Code</Button>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
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

              {/* Ads Tab */}
              {activeTab === "ads" && (
                <motion.div
                  key="ads"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AdsManager restaurantId={DEMO_RESTAURANT_ID} />
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
                  <FeedbackManager restaurantId={DEMO_RESTAURANT_ID} />
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
                  <SettingsPanel restaurantId={DEMO_RESTAURANT_ID} />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
