import { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ShoppingCart, ClipboardList, Loader2, AlertCircle, Plus, Minus, Trash2, Search, Menu, HandHelping, LayoutGrid, List } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useMenuItems, useCategories, type MenuItem } from '@/hooks/useMenuItems';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useOrders, useCreateOrder } from '@/hooks/useOrders';
import { useCreateWaiterCall } from '@/hooks/useWaiterCalls';
import { useRandomActiveAd, useTrackAdImpression, useTrackAdClick } from '@/hooks/useAds';
import { useTableByNumber } from '@/hooks/useTables';
import { useActiveOffers } from '@/hooks/useOffers';
import { WaitingTimer } from '@/components/order/WaitingTimer';
import { AdsPopup } from '@/components/menu/AdsPopup';
import { BottomNav } from '@/components/menu/BottomNav';
import { AddedToCartToast } from '@/components/menu/AddedToCartToast';
import { CategorySlider } from '@/components/menu/CategorySlider';
import { CustomerTopBar } from '@/components/menu/CustomerTopBar';
import { FloatingCartBar } from '@/components/menu/FloatingCartBar';
import { MenuItemRow } from '@/components/menu/MenuItemRow';
import { FoodCard } from '@/components/menu/FoodCard';
import { OrderStatusPipeline } from '@/components/menu/OrderStatusPipeline';
import { OffersSlider } from '@/components/menu/OffersSlider';
import { QRSplashScreen } from '@/components/branding/QRSplashScreen';

type ViewType = 'home' | 'menu' | 'cart' | 'orders' | 'profile';

const CustomerMenu = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get('r') || '';
  const tableId = searchParams.get('table') || '';
  const isPreviewMode = !tableId;
  const { toast } = useToast();

  const [currentView, setCurrentView] = useState<ViewType>('menu');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [adShown, setAdShown] = useState(false);
  const [showAddedToast, setShowAddedToast] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState('');
  const [menuViewMode, setMenuViewMode] = useState<'list' | 'grid'>('list');

  // Fetch restaurant data
  const { data: restaurant, isLoading: restaurantLoading } = useRestaurant(restaurantId);

  // Fetch offers
  const { data: offers = [] } = useActiveOffers(restaurantId);

  // Fetch menu items
  const { data: menuItems = [], isLoading: menuLoading } = useMenuItems(restaurantId);

  // Fetch categories
  const { data: categories = [] } = useCategories(restaurantId);

  // Resolve table number to table UUID (skip in preview mode)
  const { data: tableData, isLoading: tableLoading } = useTableByNumber(restaurantId, tableId);
  const resolvedTableId = tableData?.id;

  // Fetch customer orders
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
        setTimeout(() => setShowAdPopup(true), 500);
        setAdShown(true);
        trackImpression.mutate(activeAd.id);
        sessionStorage.setItem(adSeenKey, Date.now().toString());
      }
    }
  }, [activeAd, adShown, restaurant, trackImpression]);

  // Filter orders for this table
  const customerOrders = useMemo(() => 
    allOrders.filter(o => o.table_id === resolvedTableId).slice(0, 10),
    [allOrders, resolvedTableId]
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

  // Find active order
  const activeOrder = useMemo(() => {
    return customerOrders.find(
      (o) => o.status !== "completed" && o.status !== "cancelled" && o.status !== "served"
    );
  }, [customerOrders]);

  // Calculate estimated prep time
  const estimatedPrepTime = useMemo(() => {
    if (!activeOrder) return 15;
    const prepTimes = activeOrder.order_items?.map(() => 15) || [15];
    return Math.max(...prepTimes, 10);
  }, [activeOrder]);

  // Restaurant settings
  const currencySymbol = restaurant?.currency || '₹';
  const taxRate = Number(restaurant?.tax_rate) || 5;
  const serviceChargeRate = Number(restaurant?.service_charge_rate) || 0;
  const brandingConfig = ((restaurant?.settings as any)?.branding) || {};
  const primaryColor = restaurant?.primary_color || undefined;

  // Get item quantity in cart
  const getItemQuantity = useCallback((itemId: string) => {
    const cartItem = cartItems.find(i => i.id === itemId);
    return cartItem?.quantity || 0;
  }, [cartItems]);

  const handleAddToCart = useCallback((item: MenuItem & { category?: { name: string } | null }) => {
    addItem({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      category: item.category?.name || 'Uncategorized',
      image_url: item.image_url || undefined,
    });
    setLastAddedItem(item.name);
    setShowAddedToast(true);
    setTimeout(() => setShowAddedToast(false), 2000);
  }, [addItem]);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add items to your cart before placing an order.',
        variant: 'destructive',
      });
      return;
    }

    if (!tableId || !restaurantId || !resolvedTableId) {
      toast({
        title: 'Invalid table',
        description: 'Please scan a valid QR code at your table.',
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
          table_id: resolvedTableId,
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
    if (!resolvedTableId || !restaurantId) {
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
        table_id: resolvedTableId,
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

  const handleApplyCoupon = (code: string) => {
    toast({
      title: 'Coupon Applied!',
      description: `Code "${code}" has been applied to your cart.`,
    });
  };

  // Loading state — show splash (skip table loading in preview mode)
  if (restaurantLoading || menuLoading || (!isPreviewMode && tableLoading)) {
    return (
      <QRSplashScreen
        restaurantName={restaurant?.name || 'Restaurant'}
        logoUrl={restaurant?.logo_url}
        animation={brandingConfig.letter_animation}
        speed={brandingConfig.animation_speed}
        mascot={brandingConfig.mascot}
        primaryColor={primaryColor}
        isLoading={true}
      />
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

  const renderHome = () => (
    <div className="space-y-6">
      {/* Offers Slider */}
      {offers.length > 0 && (
        <OffersSlider offers={offers} />
      )}

      {/* Banner */}
      {restaurant?.banner_image_url && (
        <div className="rounded-2xl overflow-hidden -mx-4 -mt-4 mb-4">
          <img src={restaurant.banner_image_url} alt="Banner" className="w-full h-44 object-cover" />
        </div>
      )}

      {/* Welcome Section */}
      <div className="text-center py-6">
        {restaurant?.logo_url && (
          <img 
            src={restaurant.logo_url} 
            alt={restaurant.name}
            className="w-20 h-20 mx-auto mb-3 rounded-2xl object-cover shadow-md"
          />
        )}
        <h2 className="text-2xl font-bold">{restaurant?.name}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{restaurant?.description || 'Welcome!'}</p>
        {tableNumber && (
          <Badge variant="secondary" className="mt-3">Table {tableNumber}</Badge>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="card-hover cursor-pointer border-primary/20" onClick={() => setCurrentView('menu')}>
          <CardContent className="p-5 text-center">
            <Menu className="w-7 h-7 mx-auto mb-2 text-primary" />
            <p className="font-semibold text-sm">View Menu</p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer border-warning/20" onClick={handleCallWaiter}>
          <CardContent className="p-5 text-center">
            <HandHelping className="w-7 h-7 mx-auto mb-2 text-warning" />
            <p className="font-semibold text-sm">Call Waiter</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Order */}
      {activeOrder && (
        <div>
          <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">Active Order</h3>
          <OrderStatusPipeline currentStatus={activeOrder.status} />
          <WaitingTimer
            order={activeOrder}
            estimatedMinutes={estimatedPrepTime}
            currencySymbol={currencySymbol}
            onViewDetails={() => setCurrentView('orders')}
          />
        </div>
      )}
    </div>
  );

  const renderMenu = () => (
    <div className="space-y-4">
      {/* Offers Slider */}
      {offers.length > 0 && (
        <OffersSlider offers={offers} />
      )}

      {/* Search + View Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full bg-muted/50 border-0"
          />
        </div>
        <div className="flex items-center bg-muted rounded-lg p-0.5">
          <Button
            variant={menuViewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setMenuViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={menuViewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setMenuViewMode('grid')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Categories */}
      <CategorySlider
        categories={categoryNames}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Menu Items */}
      {menuViewMode === 'list' ? (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <MenuItemRow
                key={item.id}
                id={item.id}
                name={item.name}
                description={item.description}
                price={Number(item.price)}
                imageUrl={item.image_url}
                isVegetarian={item.is_vegetarian || false}
                isPopular={item.is_popular || false}
                prepTime={item.prep_time_minutes}
                currencySymbol={currencySymbol}
                quantity={getItemQuantity(item.id)}
                onAdd={() => handleAddToCart(item)}
                onIncrement={() => updateQuantity(item.id, getItemQuantity(item.id) + 1)}
                onDecrement={() => updateQuantity(item.id, getItemQuantity(item.id) - 1)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <FoodCard
                key={item.id}
                id={item.id}
                name={item.name}
                description={item.description}
                price={Number(item.price)}
                imageUrl={item.image_url}
                isVegetarian={item.is_vegetarian || false}
                isPopular={item.is_popular || false}
                currencySymbol={currencySymbol}
                quantity={getItemQuantity(item.id)}
                onAdd={() => handleAddToCart(item)}
                onIncrement={() => updateQuantity(item.id, getItemQuantity(item.id) + 1)}
                onDecrement={() => updateQuantity(item.id, getItemQuantity(item.id) - 1)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

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
                <div className="flex items-center gap-3">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {currencySymbol}{item.price} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </Button>
                    <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
            className="w-full bg-success hover:bg-success/90"
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
      {/* Active Order with Pipeline */}
      {activeOrder && (
        <div>
          <OrderStatusPipeline currentStatus={activeOrder.status} />
          <WaitingTimer
            order={activeOrder}
            estimatedMinutes={estimatedPrepTime}
            currencySymbol={currencySymbol}
          />
        </div>
      )}

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
                <Badge
                  className={
                    order.status === 'pending' ? 'bg-warning/20 text-warning border-0' :
                    order.status === 'preparing' ? 'bg-info/20 text-info border-0' :
                    order.status === 'ready' ? 'bg-success/20 text-success border-0' :
                    order.status === 'served' ? 'bg-success/20 text-success border-0' :
                    order.status === 'completed' ? 'bg-muted text-muted-foreground border-0' :
                    ''
                  }
                >
                  {order.status === 'pending' ? 'Placed' : 
                   order.status?.charAt(0).toUpperCase() + (order.status?.slice(1) || '')}
                </Badge>
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

  const renderProfile = () => (
    <div className="space-y-4 text-center py-12">
      <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
        <span className="text-3xl">👤</span>
      </div>
      <h3 className="font-semibold text-lg">Guest</h3>
      <p className="text-sm text-muted-foreground">Table {tableNumber || 'N/A'}</p>
      {restaurant && (
        <p className="text-sm text-muted-foreground">{restaurant.name}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="bg-warning/20 text-warning-foreground text-center py-2 text-xs font-medium border-b border-warning/30">
          👁️ Preview Mode — Ordering is disabled
        </div>
      )}

      {/* Ads Popup */}
      <AdsPopup
        ad={activeAd || null}
        open={showAdPopup}
        onOpenChange={setShowAdPopup}
        onApplyCoupon={handleApplyCoupon}
        onSkip={() => setShowAdPopup(false)}
        onClickThrough={handleAdClick}
      />

      {/* Added to Cart Toast */}
      <AddedToCartToast show={showAddedToast} itemName={lastAddedItem} />

      {/* Branded Top Bar */}
      <CustomerTopBar
        restaurantName={restaurant?.name || 'Restaurant'}
        logoUrl={restaurant?.logo_url}
        tableNumber={isPreviewMode ? 'Preview' : tableNumber}
        cartCount={isPreviewMode ? 0 : getTotalItems()}
        onCallWaiter={handleCallWaiter}
        onCartClick={() => !isPreviewMode && setCurrentView('cart')}
        isCallingWaiter={createWaiterCall.isPending}
        primaryColor={primaryColor}
        branding={brandingConfig}
      />

      {/* Content */}
      <main className="container mx-auto px-4 py-4">
        {currentView === 'home' && renderHome()}
        {currentView === 'menu' && renderMenu()}
        {!isPreviewMode && currentView === 'cart' && renderCart()}
        {!isPreviewMode && currentView === 'orders' && renderOrders()}
        {currentView === 'profile' && renderProfile()}
        {isPreviewMode && (currentView === 'cart' || currentView === 'orders') && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">Not available in preview mode</p>
            <p className="text-sm mt-1">Scan a QR code at a table to place orders</p>
          </div>
        )}
      </main>

      {/* Floating Cart Bar (menu view only, not in preview) */}
      {!isPreviewMode && currentView === 'menu' && (
        <FloatingCartBar
          itemCount={getTotalItems()}
          totalPrice={getTotalPrice()}
          currencySymbol={currencySymbol}
          onViewCart={() => setCurrentView('cart')}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav
        currentView={currentView}
        onViewChange={setCurrentView}
        cartCount={isPreviewMode ? 0 : getTotalItems()}
        orderCount={isPreviewMode ? 0 : customerOrders.filter(o => o.status !== 'completed').length}
      />
    </div>
  );
};

export default CustomerMenu;
