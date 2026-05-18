import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

/** Append cache-busting param to storage URLs */
function cacheBustUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    u.searchParams.set('v', String(Math.floor(Date.now() / 60000)));
    return u.toString();
  } catch {
    return url;
  }
}
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ClipboardList, Loader2, AlertCircle, Plus, Minus, Trash2, Search, Menu, HandHelping, LayoutGrid, List, MessageSquare } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useMenuItems, useCategories, type MenuItem } from '@/hooks/useMenuItems';
import { useRestaurantDetails } from '@/hooks/useRestaurant';
import { useCreateOrder } from '@/hooks/useOrders';
import { useCustomerOrders } from '@/hooks/useCustomerOrders';
import { useCreateWaiterCall } from '@/hooks/useWaiterCalls';

import { useTableByNumber, useTables } from '@/hooks/useTables';
import { TablePickerDialog } from '@/components/menu/TablePickerDialog';
import { useActiveEnterprisePromotions } from '@/hooks/useEnterprisePromotions';
import { evaluateCartDiscounts } from '@/services/promotions/cartPricingEngine';
import { WaitingTimer } from '@/components/order/WaitingTimer';
import { PromotionCarousel } from '@/components/menu/PromotionCarousel';

import { BottomNav } from '@/components/menu/BottomNav';
import { AddedToCartToast } from '@/components/menu/AddedToCartToast';
import { CategorySlider } from '@/components/menu/CategorySlider';
import { CustomerTopBar } from '@/components/menu/CustomerTopBar';
import { FloatingCartBar } from '@/components/menu/FloatingCartBar';
import { MenuItemRow } from '@/components/menu/MenuItemRow';
import { FoodCard } from '@/components/menu/FoodCard';
import { OrderStatusPipeline } from '@/components/menu/OrderStatusPipeline';
import { analyticsService } from '@/services/analyticsService';
import { OffersSlider } from '@/components/menu/OffersSlider';
import { RecommendedSlider } from '@/components/menu/RecommendedSlider';
import { QRSplashScreen } from '@/components/branding/QRSplashScreen';
import { TenantThemeProvider } from '@/components/admin/TenantThemeProvider';
import { SOUNDS } from '@/hooks/useSound';
import { PostOrderReviewPrompt } from '@/components/order/PostOrderReviewPrompt';
import { RecommendationsSection } from '@/components/menu/RecommendationsSection';
import { ItemDetailsDialog } from '@/components/menu/ItemDetailsDialog';
import { MenuGridSkeleton, MenuListSkeleton } from '@/components/menu/MenuSkeletons';
import { notificationService, type NotificationType } from '@/services/notificationService';
import { NotificationBar } from '@/components/menu/NotificationBar';

type ViewType = 'home' | 'menu' | 'cart' | 'orders' | 'profile';

const CustomerMenu = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const slug = searchParams.get('slug') || '';
  const restaurantIdParam = searchParams.get('r') || '';
  const tableId = searchParams.get('table') || '';
  const isDemoMode = searchParams.get('demo') === 'true';

  // Slug-based tenant resolution — also fetch basic branding for splash
  const [resolvedRestaurantId, setResolvedRestaurantId] = useState(restaurantIdParam);
  const [splashBranding, setSplashBranding] = useState<{
    name: string; logo_url: string | null; primary_color: string | null;
  } | null>(null);
  
  useEffect(() => {
    const idToUse = restaurantIdParam || undefined;
    const query = slug && !restaurantIdParam
      ? supabase.from('restaurants_public').select('id, name, logo_url, primary_color').eq('slug', slug).eq('is_active', true).single()
      : idToUse
      ? supabase.from('restaurants_public').select('id, name, logo_url, primary_color').eq('id', idToUse).single()
      : null;

    if (query) {
      query.then(({ data }) => {
        if (data) {
          if (!restaurantIdParam) setResolvedRestaurantId(data.id);
          setSplashBranding({ name: data.name, logo_url: data.logo_url, primary_color: data.primary_color });
        }
      });
    }
  }, [slug, restaurantIdParam]);

  const restaurantId = resolvedRestaurantId;
  // Restore table from localStorage if URL param is absent (4-hour expiry)
  const getPersistedTable = (rId: string): string => {
    try {
      const raw = localStorage.getItem(`qr_table_${rId}`);
      if (!raw) return '';
      const { tableNumber, timestamp } = JSON.parse(raw);
      const FOUR_HOURS = 4 * 60 * 60 * 1000;
      if (Date.now() - timestamp > FOUR_HOURS) {
        localStorage.removeItem(`qr_table_${rId}`);
        return '';
      }
      return tableNumber || '';
    } catch {
      return '';
    }
  };

  const [dynamicTableId, setDynamicTableId] = useState(
    tableId || (restaurantId ? getPersistedTable(restaurantId) : '')
  );
  const isPreviewMode = false;
  const showTablePicker = !dynamicTableId && !!restaurantId;
  const { toast } = useToast();

  const [activeNotification, setActiveNotification] = useState<{
    id: string;
    title: string;
    message: string;
    type: NotificationType;
  } | null>(null);

  const [currentView, setCurrentView] = useState<ViewType>('menu');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddedToast, setShowAddedToast] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState('');
  const [menuViewMode, setMenuViewMode] = useState<'list' | 'grid'>('grid');
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [reviewImmediate, setReviewImmediate] = useState(false);
  const prevOrderStatusesRef = useRef<Record<string, string>>({});

  // Fetch restaurant data
  // Fetch restaurant - try authenticated first, fall back to public view for anon users
  const { data: restaurantAuth } = useRestaurantDetails(restaurantId);
  const { data: restaurantPub, isLoading: restaurantLoading } = useQuery({
    queryKey: ['restaurant_public_by_id', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return null;
      const { data, error } = await supabase
        .from('restaurants_public')
        .select('*')
        .eq('id', restaurantId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000,
  });
  // Merge: use auth data when available (has tax_rate, settings etc), else public view
  const restaurant = restaurantAuth || restaurantPub as any;

  // Fetch offers
  const { data: offers = [] } = useActiveEnterprisePromotions(restaurantId);

  // Fetch active ads from the global Ads Manager (Secure Query with RLS & Expiry checks)
  const { data: promotions = [], refetch: refetchPromotions } = useQuery({
    queryKey: ['active-promotions', restaurantId],
    queryFn: async () => {
      const now = new Date().toISOString();
      console.log(`[Query] Fetching active ads for restaurantId: ${restaurantId} at ${now}...`);
      
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('is_active', true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`);

      if (error) {
        console.error('[Query Error] Failed to fetch active ads:', error);
        throw error;
      }

      // Filter client-side by target_restaurants (isolation for tenants)
      let filtered = data || [];
      if (restaurantId) {
        filtered = filtered.filter(ad => {
          const targets = ad.target_restaurants as string[] | null;
          if (!targets || targets.length === 0) return true; // Null means all restaurants
          return targets.includes(restaurantId);
        });
      }

      // Sort by priority descending
      filtered.sort((a, b) => (b.priority || 0) - (a.priority || 0));

      console.log('PROMOTIONS:', filtered);
      return filtered;
    },
    staleTime: 1 * 60 * 1000, // 1 minute stale time for fast synchronization
  });

  // Realtime synchronization for active ads table
  useEffect(() => {
    if (!restaurantId) return;

    console.log("[Realtime] Subscribing to changes on the 'ads' table...");
    const channel = supabase
      .channel('ads-realtime-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ads'
        },
        (payload) => {
          console.log('[Realtime Notification] Change detected in ads table:', payload);
          refetchPromotions();
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Subscription status for ads: ${status}`);
      });

    return () => {
      console.log("[Realtime] Unsubscribing from 'ads' table channel...");
      supabase.removeChannel(channel);
    };
  }, [restaurantId, refetchPromotions]);

  // Fetch menu items
  const { data: menuItems = [], isLoading: menuLoading } = useMenuItems(restaurantId);

  // Fetch categories
  const { data: categories = [] } = useCategories(restaurantId);

  // Fetch all tables for picker
  const { data: allTables = [] } = useTables(restaurantId);

  // Resolve table number to table UUID
  const { data: tableData, isLoading: tableLoading } = useTableByNumber(restaurantId, dynamicTableId || undefined);
  const resolvedTableId = tableData?.id;

  // Fetch customer orders for this table (with realtime)
  const { data: customerOrders = [] } = useCustomerOrders(restaurantId, resolvedTableId);


  // Mutations
  const createOrder = useCreateOrder();
  const createWaiterCall = useCreateWaiterCall();

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

  // Query client for realtime invalidation
  const queryClient = useQueryClient();

  // Set table from URL or dynamic selection
  useEffect(() => {
    if (dynamicTableId) {
      setTableNumber(dynamicTableId);
    }
  }, [dynamicTableId, setTableNumber]);

  // Track category views in analytics
  useEffect(() => {
    if (selectedCategory && restaurantId) {
      analyticsService.trackEvent({
        campaignId: selectedCategory === 'All' ? 'all_categories' : selectedCategory,
        eventType: 'category_opened',
        tenantId: restaurantId
      });
    }
  }, [selectedCategory, restaurantId]);

  const handleTableSelect = (tableNumber: string) => {
    setDynamicTableId(tableNumber);
    // Persist to localStorage for session survival
    if (restaurantId) {
      localStorage.setItem(
        `qr_table_${restaurantId}`,
        JSON.stringify({ tableNumber, timestamp: Date.now() })
      );
    }
    // Update URL without reload
    const url = new URL(window.location.href);
    url.searchParams.set('table', tableNumber);
    window.history.replaceState({}, '', url.toString());
  };

  // Realtime subscriptions for live sync
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`menu-realtime-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurants', filter: `id=eq.${restaurantId}` },
        () => { queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] }); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'offers', filter: `restaurant_id=eq.${restaurantId}` },
        () => { queryClient.invalidateQueries({ queryKey: ['offers'] }); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items', filter: `restaurant_id=eq.${restaurantId}` },
        () => { queryClient.invalidateQueries({ queryKey: ['menuItems', restaurantId] }); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurantId, queryClient]);



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

  const recommendedItems = useMemo(() => {
    // Return items that have is_popular === true, or fall back to the first 6 items in menuItems
    const popular = menuItems.filter(item => item.is_popular && item.is_available);
    if (popular.length > 0) return popular;
    return menuItems.filter(item => item.is_available).slice(0, 6);
  }, [menuItems]);

  // Find active order (including served so we can track the transition)
  const activeOrder = useMemo(() => {
    return customerOrders.find(
      (o) => o.status !== "completed" && o.status !== "cancelled"
    );
  }, [customerOrders]);

  // ===== Upgraded Realtime Sound & Immersive Haptic Order Notification System =====
  const prevOrderStatusRef = useRef<string | null>(null);

  useEffect(() => {
    const currentStatus = activeOrder?.status || null;
    const prevStatus = prevOrderStatusRef.current;

    if (prevStatus && currentStatus && prevStatus !== currentStatus && activeOrder) {
      const soundStatuses = ['accepted', 'preparing', 'ready', 'served', 'completed'];
      
      if (soundStatuses.includes(currentStatus)) {
        const dedupeId = `${activeOrder.id}_${currentStatus}`;
        
        if (notificationService.shouldTrigger(dedupeId)) {
          // Resolve matching category configs
          let eventType: NotificationType = 'received';
          let title = 'Order Update';
          let message = `Your order status changed to ${currentStatus}.`;

          if (currentStatus === 'accepted') {
            eventType = 'received';
            title = '✅ Order Accepted';
            message = 'Our kitchen team has received and verified your order. Prep starts now!';
          } else if (currentStatus === 'preparing') {
            eventType = 'preparing';
            title = '👨‍🍳 Chef is Preparing!';
            message = 'Your freshly ordered dishes are currently in the hot pan. Smells amazing!';
          } else if (currentStatus === 'ready') {
            eventType = 'ready';
            title = '🔔 Order Ready to Serve!';
            message = 'Your delicious meal is ready to be served. Our waitstaff is bringing it hot!';
          } else if (currentStatus === 'served') {
            eventType = 'delivered';
            title = '🍽️ Order Served';
            message = `Enjoy your meal! Your hot food has been served at Table ${tableNumber || 'N/A'}.`;
          } else if (currentStatus === 'completed') {
            eventType = 'delivered';
            title = '✨ Meal Completed';
            message = 'Thank you for dining with us! We hope you loved your culinary experience.';
          }

          // 1. Play Dynamic Tone / Buzz Haptic Fallback
          notificationService.playSound(eventType, restaurantId);

          // 2. Trigger Premium UI Slides Down
          setActiveNotification({
            id: dedupeId,
            title,
            message,
            type: eventType
          });

          // 3. Log / Sync public notification record in DB (RLS Protected)
          notificationService.logNotification({
            restaurant_id: restaurantId || '',
            table_id: dynamicTableId || undefined,
            order_id: activeOrder.id,
            title,
            message,
            event_type: eventType
          });

          // Auto-trigger review prompt when order is served
          if (currentStatus === 'served') {
            setReviewOrderId(activeOrder.id);
            setReviewImmediate(false);
          }
        }
      }
    }

    prevOrderStatusRef.current = currentStatus;
  }, [activeOrder?.status, restaurantId, dynamicTableId, tableNumber]);


  const estimatedPrepTime = useMemo(() => {
    if (!activeOrder) return 15;
    const prepTimes = activeOrder.order_items?.map(() => 15) || [15];
    return Math.max(...prepTimes, 10);
  }, [activeOrder]);

  // Restaurant settings
  const currencyRaw = restaurant?.currency || 'INR';
  const currencySymbolMap: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', SAR: '﷼' };
  const currencySymbol = currencySymbolMap[currencyRaw] || currencyRaw;
  const taxRate = Number(restaurant?.tax_rate) || 5;
  const serviceChargeRate = Number(restaurant?.service_charge_rate) || 0;
  const brandingConfig = useMemo(() => {
    const fromSettings = ((restaurant?.settings as any)?.branding) || {};
    const fromTheme = ((restaurant?.theme_config as any)?.branding) || {};

    return {
      animation_enabled: fromSettings.animation_enabled ?? fromTheme.animation_enabled ?? true,
      letter_animation: fromSettings.letter_animation ?? fromTheme.letter_animation ?? 'wave',
      mascot: fromSettings.mascot ?? fromTheme.mascot ?? 'none',
      mascot_image_url: fromSettings.mascot_image_url ?? fromTheme.mascot_image_url,
      animation_speed: fromSettings.animation_speed ?? fromTheme.animation_speed ?? 'normal',
      glow_color_sync: fromSettings.glow_color_sync ?? fromTheme.glow_color_sync ?? true,
    };
  }, [restaurant]);
  const primaryColor = restaurant?.primary_color || splashBranding?.primary_color || undefined;

  // Menu display settings from restaurant
  const menuDisplaySettings = useMemo(() => {
    const md = (restaurant?.settings as any)?.menu_display;
    return {
      view_mode: md?.view_mode || 'grid',
      show_offers: md?.show_offers ?? true,
      show_dietary_badges: md?.show_dietary_badges ?? true,
      card_style: md?.card_style || 'standard',
    };
  }, [restaurant]);

  // Sync view mode from restaurant settings on initial load
  useEffect(() => {
    setMenuViewMode(menuDisplaySettings.view_mode);
  }, [menuDisplaySettings.view_mode]);

  // Get item quantity in cart (sum across all customization variants of same item)
  const getItemQuantity = useCallback((itemId: string) => {
    return cartItems.filter(i => i.id === itemId).reduce((sum, i) => sum + i.quantity, 0);
  }, [cartItems]);

  // Get the cartKey for a simple (no-variants) item
  const getItemCartKey = useCallback((itemId: string) => {
    const cartItem = cartItems.find(i => i.id === itemId);
    return cartItem?.cartKey || `${itemId}____`;
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

  const cartPricing = useMemo(() => {
    return evaluateCartDiscounts(
      cartItems.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      offers as any[],
      taxRate / 100,
      0 // No delivery fee
    );
  }, [cartItems, offers, taxRate]);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add items to your cart before placing an order.',
        variant: 'destructive',
      });
      return;
    }

    if (!dynamicTableId || !restaurantId || !resolvedTableId) {
      toast({
        title: 'Invalid table',
        description: 'Please scan a valid QR code at your table.',
        variant: 'destructive',
      });
      return;
    }

    const subtotal = cartPricing.subtotal;
    const taxAmount = cartPricing.tax;
    const serviceCharge = (cartPricing.subtotal - cartPricing.totalDiscount) * (serviceChargeRate / 100);
    const total = cartPricing.finalTotal + serviceCharge;

    if (isDemoMode) {
      toast({
        title: '🎉 Demo Order Placed!',
        description: 'This is a demo — your order was not sent to the kitchen.',
      });
      clearCart();
      setCurrentView('menu');
      return;
    }

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
    } catch (err: any) {
      console.error('Order placement failed:', err?.message || err);
      toast({
        title: 'Order Failed',
        description: err?.message || 'Failed to place order. Please try again.',
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


  const isDataLoading = restaurantLoading || menuLoading || (dynamicTableId && tableLoading);

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
      {menuDisplaySettings.show_offers && offers.length > 0 && (
        <OffersSlider offers={offers} />
      )}

      {/* Active Ads from Ads Manager */}
      {promotions && promotions.length > 0 && (
        <PromotionCarousel
          promotions={promotions}
          categories={categories}
          onSelectCategory={(catName) => setSelectedCategory(catName)}
          onApplyCoupon={(code) => {
            console.log(`[Coupon Applied] Code: ${code}`);
          }}
        />
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
            src={cacheBustUrl(restaurant.logo_url)} 
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
    <div>

      {/* Search + Scan QR */}
      <div className="sticky top-[56px] z-30 bg-background pb-3 -mx-4 px-4 pt-2 transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 flex items-center group">
            <Search className="absolute left-4 w-5 h-5 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
            <Input
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-10 h-11 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 text-sm focus-visible:ring-1 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/50 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.02)]"
            />
            {/* Filter icon placeholder */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-4 text-zinc-400">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
          </div>
          <Button className="h-11 px-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex flex-col items-center justify-center gap-0.5 min-w-[64px] shadow-sm border border-emerald-500/20 active:scale-95 transition-transform">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h.01"/><path d="M17 7h.01"/><path d="M7 17h.01"/><path d="M17 17h.01"/></svg>
            <span className="text-[9px] font-bold leading-none tracking-tight">Scan QR</span>
          </Button>
        </div>

        {/* Categories */}
        <CategorySlider
          categories={categoryNames}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Dynamic Advertisement Banners */}
      {promotions && promotions.length > 0 && (
        <PromotionCarousel
          promotions={promotions}
          categories={categories}
          onSelectCategory={(catName) => setSelectedCategory(catName)}
          onApplyCoupon={(code) => {
            console.log(`[Coupon Applied] Code: ${code}`);
          }}
        />
      )}

      {/* Dynamic Offers Slider (Promotions) */}
      {offers && offers.length > 0 && (
        <OffersSlider offers={offers} />
      )}

      {/* Recommended Section Header */}
      {recommendedItems.length > 0 && (
        <>
          <div className="flex items-center justify-between mt-6 mb-4">
            <h3 className="font-extrabold text-xl text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5 tracking-tight">
              Recommended for you <span className="text-emerald-500 text-lg">✨</span>
            </h3>
            <button
              onClick={() => setSelectedCategory('All')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 hover:text-emerald-500 hover:underline transition-colors"
            >
              View all
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>

          <RecommendedSlider
            items={recommendedItems}
            currencySymbol={currencySymbol}
            getItemQuantity={getItemQuantity}
            onAdd={handleAddToCart}
            onIncrement={(item) => updateQuantity(getItemCartKey(item.id), getItemQuantity(item.id) + 1)}
            onDecrement={(item) => updateQuantity(getItemCartKey(item.id), getItemQuantity(item.id) - 1)}
            onItemClick={(item) => setSelectedItemForDetails(item)}
          />
        </>
      )}


      {/* Menu Items */}
      <div className="mt-4">
      {menuLoading ? (
        menuViewMode === 'list' ? <MenuListSkeleton /> : <MenuGridSkeleton />
      ) : menuViewMode === 'list' ? (
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
                onIncrement={() => updateQuantity(getItemCartKey(item.id), getItemQuantity(item.id) + 1)}
                onDecrement={() => updateQuantity(getItemCartKey(item.id), getItemQuantity(item.id) - 1)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
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
                onIncrement={() => updateQuantity(getItemCartKey(item.id), getItemQuantity(item.id) + 1)}
                onDecrement={() => updateQuantity(getItemCartKey(item.id), getItemQuantity(item.id) - 1)}
                onClick={() => setSelectedItemForDetails(item)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {!menuLoading && filteredItems.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No items found
        </div>
      )}
      </div>
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
            <Card key={item.cartKey}>
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
                      onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </Button>
                    <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeItem(item.cartKey)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Intelligent Recommendations */}
          <RecommendationsSection 
            cartItemNames={cartItems.map(item => item.name)}
            allMenuItems={menuItems}
            onAddItem={(id) => {
              const item = menuItems.find(mi => mi.id === id);
              if (item) {
                addItem(item);
                if (restaurantId) {
                  analyticsService.trackEvent({
                    campaignId: id,
                    eventType: 'recommendation_click',
                    tenantId: restaurantId,
                    metadata: {
                      item_name: item.name,
                      price: item.price
                    }
                  });
                }
              }
            }}
            currencySymbol={currencySymbol}
          />

          {/* Order Summary */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{currencySymbol}{cartPricing.subtotal.toFixed(2)}</span>
              </div>
              
              {cartPricing.appliedDiscounts.map(discount => (
                <div key={discount.promotionId} className="flex justify-between text-sm text-green-600 font-medium">
                  <span>✨ {discount.title}</span>
                  <span>-{currencySymbol}{discount.discountAmount.toFixed(2)}</span>
                </div>
              ))}

              <div className="flex justify-between text-sm">
                <span>Tax ({taxRate}%)</span>
                <span>{currencySymbol}{cartPricing.tax.toFixed(2)}</span>
              </div>
              {serviceChargeRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Service ({serviceChargeRate}%)</span>
                  <span>{currencySymbol}{((cartPricing.subtotal - cartPricing.totalDiscount) * serviceChargeRate / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">
                  {currencySymbol}{(cartPricing.finalTotal + (cartPricing.subtotal - cartPricing.totalDiscount) * serviceChargeRate / 100).toFixed(2)}
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
              {order.status === 'served' && (
                <Button
                  size="sm"
                  className="w-full mt-3 gap-2"
                  variant="outline"
                  onClick={() => { setReviewImmediate(true); setReviewOrderId(order.id); }}
                >
                  <MessageSquare className="w-4 h-4" />
                  Rate Your Experience ⭐
                </Button>
              )}
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

  // Use splash branding (fast) or restaurant data (complete) for the splash screen
  const splashName = restaurant?.name || splashBranding?.name || 'Restaurant';
  const splashLogo = cacheBustUrl(restaurant?.logo_url) || cacheBustUrl(splashBranding?.logo_url);
  const splashColor = primaryColor || splashBranding?.primary_color || undefined;

  return (
    <TenantThemeProvider primaryColor={restaurant?.primary_color} secondaryColor={restaurant?.secondary_color}>
    {/* Splash Screen Overlay */}
    <QRSplashScreen
      restaurantName={splashName}
      logoUrl={splashLogo}
      animation={brandingConfig.letter_animation}
      speed={brandingConfig.animation_speed}
      mascot={brandingConfig.mascot}
      primaryColor={splashColor}
      isLoading={!!isDataLoading}
    />
    <div className="min-h-[100dvh] bg-background pb-[140px] w-full relative">
      {/* Table Picker Dialog */}
      <TablePickerDialog
        open={showTablePicker}
        tables={allTables}
        restaurantName={restaurant?.name || 'Restaurant'}
        onSelectTable={handleTableSelect}
      />

      {/* Details Dialog */}
      <ItemDetailsDialog
        item={selectedItemForDetails}
        isOpen={!!selectedItemForDetails}
        onClose={() => setSelectedItemForDetails(null)}
        onAdd={() => selectedItemForDetails && handleAddToCart(selectedItemForDetails)}
        onIncrement={() => selectedItemForDetails && updateQuantity(getItemCartKey(selectedItemForDetails.id), getItemQuantity(selectedItemForDetails.id) + 1)}
        onDecrement={() => selectedItemForDetails && updateQuantity(getItemCartKey(selectedItemForDetails.id), getItemQuantity(selectedItemForDetails.id) - 1)}
        quantity={selectedItemForDetails ? getItemQuantity(selectedItemForDetails.id) : 0}
        allMenuItems={menuItems}
        currencySymbol={currencySymbol}
        onViewCart={() => {
          setSelectedItemForDetails(null);
          setCurrentView('cart');
        }}
      />

      {/* Added to Cart Toast */}
      <AddedToCartToast
        show={showAddedToast}
        itemName={lastAddedItem}
        onClose={() => setShowAddedToast(false)}
      />

      {/* Branded Top Bar */}
      <CustomerTopBar
        restaurantName={restaurant?.name || splashBranding?.name || 'Restaurant'}
        logoUrl={cacheBustUrl(restaurant?.logo_url) || cacheBustUrl(splashBranding?.logo_url)}
        bannerImageUrl={cacheBustUrl(restaurant?.banner_image_url || restaurant?.cover_image_url)}
        tableNumber={tableNumber || 'Select Table'}
        cartCount={getTotalItems()}
        onCallWaiter={handleCallWaiter}
        onCartClick={() => dynamicTableId && setCurrentView('cart')}
        isCallingWaiter={createWaiterCall.isPending}
        primaryColor={primaryColor}
        branding={brandingConfig}
      />

      {/* Content */}
      <main className="w-full px-4 pt-0 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {currentView === 'home' && renderHome()}
            {currentView === 'menu' && renderMenu()}
            {dynamicTableId && currentView === 'cart' && renderCart()}
            {dynamicTableId && currentView === 'orders' && renderOrders()}
            {currentView === 'profile' && renderProfile()}
            {!dynamicTableId && (currentView === 'cart' || currentView === 'orders') && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">Please select a table first</p>
                <p className="text-sm mt-1">Tap to select your table</p>
                <Button variant="outline" className="mt-4" onClick={() => setDynamicTableId('')}>
                  Select Table
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Cart Bar (menu view only, when table selected) */}
      {dynamicTableId && currentView === 'menu' && (
        <FloatingCartBar
          itemCount={getTotalItems()}
          totalPrice={cartPricing.finalTotal + (cartPricing.subtotal - cartPricing.totalDiscount) * (serviceChargeRate / 100)}
          currencySymbol={currencySymbol}
          onViewCart={() => setCurrentView('cart')}
        />
      )}


      {/* Bottom Navigation — Always fixed and visible at the bottom of the viewport once loaded */}
      {!selectedItemForDetails && (
        <BottomNav
          currentView={currentView}
          onViewChange={setCurrentView}
          cartCount={getTotalItems()}
          orderCount={customerOrders.filter(o => o.status !== 'completed').length}
        />
      )}

      {/* Post-Order Review Prompt — triggers when order is served */}
      {reviewOrderId && restaurantId && (
        <PostOrderReviewPrompt
          restaurantId={restaurantId}
          orderId={reviewOrderId}
          tableId={resolvedTableId}
          googleReviewUrl={restaurant?.google_review_url}
          delayMs={reviewImmediate ? 0 : 5000}
        />
      )}

      {/* Realtime Animated Order Notification Bar Overlay */}
      <AnimatePresence>
        {activeNotification && (
          <NotificationBar
            id={activeNotification.id}
            title={activeNotification.title}
            message={activeNotification.message}
            type={activeNotification.type}
            onDismiss={() => setActiveNotification(null)}
            onActionClick={() => {
              setCurrentView('orders');
              setActiveNotification(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
    </TenantThemeProvider>
  );
};

export default CustomerMenu;
