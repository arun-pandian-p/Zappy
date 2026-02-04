import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ClipboardList, ArrowLeft, Star, HandHelping, Search, Plus, Minus, Trash2, Loader2, AlertCircle, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useMenuItems, useCategories, type MenuItem } from '@/hooks/useMenuItems';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useOrders, useCreateOrder, type OrderWithItems } from '@/hooks/useOrders';
import { useCreateWaiterCall } from '@/hooks/useWaiterCalls';
import { useRandomActiveAd, useTrackAdImpression, useTrackAdClick } from '@/hooks/useAds';

type ViewType = 'menu' | 'cart' | 'orders';

const CustomerMenu = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get('r') || '';
  const tableId = searchParams.get('table') || '';
  const { toast } = useToast();

  const [currentView, setCurrentView] = useState<ViewType>('menu');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [adShown, setAdShown] = useState(false);

  // Fetch restaurant data
  const { data: restaurant, isLoading: restaurantLoading } = useRestaurant(restaurantId);

  // Fetch menu items
  const { data: menuItems = [], isLoading: menuLoading } = useMenuItems(restaurantId);

  // Fetch categories
  const { data: categories = [] } = useCategories(restaurantId);

  // Fetch customer orders for this table
  const { data: allOrders = [] } = useOrders(restaurantId);

  // Fetch active ad
  const { data: activeAd } = useRandomActiveAd();

  // Mutations
  const createOrder = useCreateOrder();
  const createWaiterCall = useCreateWaiterCall();
  const trackImpression = useTrackAdImpression();
  const trackClick = useTrackAdClick();

  // Cart store
  const { 
    items: cartItems, 
    addItem, 
    removeItem, 
    updateQuantity, 
    getTotalItems, 
    getTotalPrice, 
    clearCart, 
    setTableNumber, 
    tableNumber 
  } = useCartStore();

  // Set table from URL
  useEffect(() => {
    if (tableId) {
      setTableNumber(tableId);
    }
  }, [tableId, setTableNumber]);

  // Show ad popup on first load
  useEffect(() => {
    if (activeAd && !adShown && restaurant?.ads_enabled !== false) {
      const adSeenKey = `ad_seen_${activeAd.id}`;
      const lastSeen = sessionStorage.getItem(adSeenKey);
      
      if (!lastSeen) {
        setShowAdPopup(true);
        setAdShown(true);
        trackImpression.mutate(activeAd.id);
        sessionStorage.setItem(adSeenKey, Date.now().toString());
      }
    }
  }, [activeAd, adShown, restaurant, trackImpression]);

  // Filter orders for this table
  const customerOrders = useMemo(() => 
    allOrders.filter(o => o.table_id === tableId).slice(0, 10),
    [allOrders, tableId]
  );

  // Get available menu items only
  const availableMenuItems = useMemo(() => 
    menuItems.filter(item => item.is_available),
    [menuItems]
  );

  // Build category list with "All" option
  const categoryNames = useMemo(() => {
    const names = ['All', ...categories.map(c => c.name)];
    return names;
  }, [categories]);

  // Filter items
  const filteredItems = useMemo(() => {
    return availableMenuItems.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category?.name === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [availableMenuItems, selectedCategory, searchQuery]);

  // Restaurant settings
  const currencySymbol = restaurant?.currency || '₹';
  const taxRate = Number(restaurant?.tax_rate) || 5;
  const serviceChargeRate = Number(restaurant?.service_charge_rate) || 0;

  const handleAddToCart = (item: MenuItem & { category?: { name: string } | null }) => {
    addItem({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      category: item.category?.name || 'Uncategorized',
      image_url: item.image_url || undefined,
    });
    toast({
      title: 'Added to cart',
      description: `${item.name} has been added to your cart.`,
    });
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add items to your cart before placing an order.',
        variant: 'destructive',
      });
      return;
    }

    if (!tableId || !restaurantId) {
      toast({
        title: 'Missing information',
        description: 'Please scan the QR code at your table.',
        variant: 'destructive',
      });
      return;
    }

    const subtotal = getTotalPrice();
    const taxAmount = subtotal * (taxRate / 100);
    const serviceCharge = subtotal * (serviceChargeRate / 100);
    const total = subtotal + taxAmount + serviceCharge;

    try {
      await createOrder.mutateAsync({
        order: {
          restaurant_id: restaurantId,
          table_id: tableId,
          subtotal,
          tax_amount: taxAmount,
          service_charge: serviceCharge,
          total_amount: total,
          status: 'pending',
        },
        items: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          menu_item_id: item.id,
        })),
      });

      toast({
        title: 'Order Placed!',
        description: 'Your order has been sent to the kitchen.',
      });

      clearCart();
      setCurrentView('orders');
    } catch (err) {
      toast({
        title: 'Order Failed',
        description: 'Failed to place order. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCallWaiter = async () => {
    if (!tableId || !restaurantId) {
      toast({
        title: 'Missing information',
        description: 'Please scan the QR code at your table.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createWaiterCall.mutateAsync({
        restaurant_id: restaurantId,
        table_id: tableId,
        reason: 'Customer assistance requested',
      });

      toast({
        title: 'Help is on the way!',
        description: 'A staff member will be with you shortly.',
      });
    } catch (err) {
      toast({
        title: 'Request Failed',
        description: 'Failed to call waiter. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAdClick = () => {
    if (activeAd) {
      trackClick.mutate(activeAd.id);
      if (activeAd.link_url) {
        window.open(activeAd.link_url, '_blank');
      }
    }
    setShowAdPopup(false);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-warning/20 text-warning border-0">Placed</Badge>;
      case 'confirmed':
        return <Badge className="bg-info/20 text-info border-0">Confirmed</Badge>;
      case 'preparing':
        return <Badge className="bg-info/20 text-info border-0">Preparing</Badge>;
      case 'ready':
        return <Badge className="bg-success/20 text-success border-0">Ready</Badge>;
      case 'served':
        return <Badge className="bg-success/20 text-success border-0">Served</Badge>;
      case 'completed':
        return <Badge className="bg-muted text-muted-foreground border-0">Completed</Badge>;
      default:
        return <Badge>{status || 'Unknown'}</Badge>;
    }
  };

  // Loading state
  if (restaurantLoading || menuLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (!restaurantId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-lg font-semibold mb-2">Invalid QR Code</h2>
            <p className="text-muted-foreground mb-4">
              Please scan a valid QR code at your table to view the menu.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderMenu = () => (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search menu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="w-full flex overflow-x-auto gap-1 h-auto p-1">
          {categoryNames.map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="flex-shrink-0 text-xs px-3 py-1.5"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Menu Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="overflow-hidden card-hover">
                <div className="relative h-32">
                  <img
                    src={item.image_url || '/placeholder.svg'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {item.is_vegetarian && (
                    <Badge className="absolute top-2 left-2 bg-success text-success-foreground text-xs">
                      Veg
                    </Badge>
                  )}
                  {item.is_popular && (
                    <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs">
                      Popular
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{item.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-primary">
                      {currencySymbol}{Number(item.price).toFixed(0)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(item)}
                      className="h-8"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No items found
        </div>
      )}
    </div>
  );

  const renderCart = () => (
    <div className="space-y-4">
      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Your cart is empty</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setCurrentView('menu')}
          >
            Browse Menu
          </Button>
        </div>
      ) : (
        <>
          {cartItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {currencySymbol}{item.price} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Order Summary */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{currencySymbol}{getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax ({taxRate}%)</span>
                <span>{currencySymbol}{(getTotalPrice() * taxRate / 100).toFixed(2)}</span>
              </div>
              {serviceChargeRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Service ({serviceChargeRate}%)</span>
                  <span>{currencySymbol}{(getTotalPrice() * serviceChargeRate / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">
                  {currencySymbol}{(getTotalPrice() * (1 + taxRate / 100 + serviceChargeRate / 100)).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={handlePlaceOrder}
            disabled={createOrder.isPending}
          >
            {createOrder.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Placing Order...
              </>
            ) : (
              'Place Order'
            )}
          </Button>
        </>
      )}
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-4">
      {customerOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
            <ClipboardList className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No Orders Yet</h3>
          <p className="text-muted-foreground text-sm">
            Your orders will appear here once placed.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setCurrentView('menu')}
          >
            Back to Menu
          </Button>
        </div>
      ) : (
        customerOrders.map((order) => (
          <Card key={order.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">#{order.order_number}</span>
                {getStatusBadge(order.status)}
              </div>
              <div className="space-y-1 mb-2">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="text-sm text-muted-foreground">
                    {item.quantity}x {item.name}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{new Date(order.created_at || Date.now()).toLocaleTimeString()}</span>
                <span className="font-medium text-foreground">
                  {currencySymbol}{Number(order.total_amount || 0).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Ad Popup */}
      <Dialog open={showAdPopup} onOpenChange={setShowAdPopup}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
            onClick={() => setShowAdPopup(false)}
          >
            <X className="w-4 h-4" />
          </Button>
          {activeAd && (
            <div className="cursor-pointer" onClick={handleAdClick}>
              {activeAd.image_url && (
                <img
                  src={activeAd.image_url}
                  alt={activeAd.title}
                  className="w-full aspect-video object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="font-bold text-lg">{activeAd.title}</h3>
                {activeAd.description && (
                  <p className="text-sm text-muted-foreground mt-1">{activeAd.description}</p>
                )}
                {activeAd.link_url && (
                  <Button className="w-full mt-3">Learn More</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-bold">{restaurant?.name || 'Restaurant'}</h1>
                {tableNumber && (
                  <p className="text-xs text-muted-foreground">Table {tableNumber}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleCallWaiter}
                disabled={createWaiterCall.isPending}
              >
                <HandHelping className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-4">
        {currentView === 'menu' && renderMenu()}
        {currentView === 'cart' && renderCart()}
        {currentView === 'orders' && renderOrders()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t pb-safe">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-2">
            {[
              { view: 'menu' as ViewType, icon: Star, label: 'Menu' },
              { view: 'cart' as ViewType, icon: ShoppingCart, label: 'Cart', badge: getTotalItems() },
              { view: 'orders' as ViewType, icon: ClipboardList, label: 'Orders', badge: customerOrders.filter(o => o.status !== 'completed').length },
            ].map(({ view, icon: Icon, label, badge }) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  currentView === view
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </div>
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default CustomerMenu;
