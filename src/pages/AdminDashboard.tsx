import { useState, useMemo } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  menuItems as initialMenuItems,
  mockTables,
  mockOrders,
  systemSettings as initialSettings,
  categories,
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

// Demo restaurant ID for testing
const DEMO_RESTAURANT_ID = "00000000-0000-0000-0000-000000000001";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [settings, setSettings] = useState(initialSettings);
  const [selectedTableId, setSelectedTableId] = useState(mockTables[0]?.id || "");

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

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Restaurant settings have been updated.",
    });
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const item: MenuItem = {
      id: Date.now().toString(),
      name: newItem.name,
      description: newItem.description,
      price: parseFloat(newItem.price),
      category: newItem.category,
      image_url:
        newItem.image_url ||
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
      is_available: true,
      is_vegetarian: newItem.is_vegetarian,
      prep_time_minutes: parseInt(newItem.prep_time_minutes) || 15,
    };

    setMenuItems((prev) => [...prev, item]);
    setNewItem({
      name: "",
      description: "",
      price: "",
      category: "Starters",
      image_url: "",
      is_vegetarian: false,
      prep_time_minutes: "15",
    });
    toast({
      title: "Item Added",
      description: `${item.name} has been added to the menu.`,
    });
  };

  const handleDeleteItem = (id: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
    toast({
      title: "Item Deleted",
      description: "Menu item has been removed.",
    });
  };

  const handleToggleAvailability = (id: string) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_available: !item.is_available } : item
      )
    );
  };

  // Computed stats
  const completedOrders = mockOrders.filter((o) => o.status === "completed");
  const todayRevenue = completedOrders.reduce((acc, o) => acc + o.total_amount, 0);
  const activeTables = mockTables.filter((t) => t.status !== "idle").length;

  // Transform orders for table display
  const recentOrders = useMemo(() => {
    return mockOrders.slice(0, 5).map((order) => ({
      id: order.id,
      tableNumber: order.table_number,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
      })),
      status: order.status as "pending" | "preparing" | "ready" | "delivered" | "completed",
      amount: order.total_amount,
    }));
  }, []);

  const selectedTable = mockTables.find((t) => t.id === selectedTableId);

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
          <AdminHeader restaurantName={settings.restaurant_name} />

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
                      value={`${settings.currency_symbol}${todayRevenue}`}
                      icon={Wallet}
                      iconColor="orange"
                      index={0}
                    />
                    <StatCard
                      label="Orders Today"
                      value={mockOrders.length}
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
                        currencySymbol={settings.currency_symbol}
                        onViewAll={() => setActiveTab("orders")}
                      />
                    </div>

                    {/* Right Panel - QR & Menu Preview */}
                    <div className="space-y-6">
                      <QuickQRSection
                        tables={mockTables.map((t) => ({
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
                                currencySymbol={settings.currency_symbol}
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
                              {categories
                                .filter((c) => c !== "All")
                                .map((cat) => (
                                  <SelectItem key={cat} value={cat}>
                                    {cat}
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
                                  currencySymbol={settings.currency_symbol}
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
                          {mockTables.map((table) => (
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
                    restaurantId={DEMO_RESTAURANT_ID} 
                    currencySymbol={settings.currency_symbol}
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
                    <KitchenDashboard embedded restaurantId={DEMO_RESTAURANT_ID} />
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
                    <BillingCounter embedded restaurantId={DEMO_RESTAURANT_ID} />
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
