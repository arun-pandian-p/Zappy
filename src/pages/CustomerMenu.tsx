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
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
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
import { useFeedbackStats } from '@/hooks/useFeedback';
import { useRecentOrders, addRecentOrderId } from '@/hooks/useRecentOrders';
import { checkRateLimit, RATE_LIMITS, getRemainingCooldown } from '@/utils/rateLimiter';

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
import { WaiterCallFAB } from '@/components/menu/WaiterCallFAB';
import { Bell } from 'lucide-react';

type ViewType = 'home' | 'search' | 'cart' | 'orders' | 'profile' | 'notifications';

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

  const [currentView, setCurrentView] = useState<ViewType>('search');
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
  const isDataLoading = restaurantLoading || menuLoading || (dynamicTableId && tableLoading);

  // Fetch customer orders for this table (with realtime)
  const { data: customerOrders = [] } = useCustomerOrders(restaurantId, resolvedTableId);

  // Fetch feedback stats
  const { data: feedbackStats } = useFeedbackStats(restaurantId || undefined);

  // Fetch recent orders stored in localStorage
  const { data: recentOrdersData = [], refreshIds: refreshRecentOrderIds } = useRecentOrders(restaurantId || undefined);

  // Fetch notification log for Alerts Tab
  const { data: tabNotifications = [] } = useQuery({
    queryKey: ['notifications-tab-history', restaurantId, resolvedTableId],
    queryFn: async () => {
      if (!restaurantId) return [];
      let query = supabase
        .from('customer_events')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .like('event_type', 'notification_%')
        .order('created_at', { ascending: false })
        .limit(30);

      if (resolvedTableId) {
        query = query.eq('table_id', resolvedTableId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!restaurantId,
    refetchInterval: 10000,
  });

  // Unified display orders for this customer (merges table and device localStorage orders)
  const displayOrders = useMemo(() => {
    const merged = [...customerOrders];
    recentOrdersData.forEach((ro) => {
      if (!merged.some((co) => co.id === ro.id)) {
        merged.push(ro);
      }
    });
    return merged.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [customerOrders, recentOrdersData]);


  // Mutations
  const createOrder = useCreateOrder();
  const createWaiterCall = useCreateWaiterCall();

  // Fetch active table session for the table
  const { data: activeSession, refetch: refetchActiveSession } = useQuery({
    queryKey: ['active-table-session', restaurantId, resolvedTableId],
    queryFn: async () => {
      if (!restaurantId || !resolvedTableId) return null;
      const { data, error } = await supabase
        .from('table_sessions')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('table_id', resolvedTableId)
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Error fetching table session:', error);
        return null;
      }
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!restaurantId && !!resolvedTableId,
    staleTime: 5000,
  });

  const createTableSession = useMutation({
    mutationFn: async () => {
      if (!restaurantId || !resolvedTableId) return null;
      const { data, error } = await supabase
        .from('table_sessions')
        .insert({
          restaurant_id: restaurantId,
          table_id: resolvedTableId,
          status: 'seated',
          seated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-table-session', restaurantId, resolvedTableId] });
    }
  });

  // Table Session Validation & Auto-creation/stale check
  useEffect(() => {
    if (!restaurantId || !resolvedTableId || isDataLoading) return;

    const validateSession = async () => {
      if (activeSession === null && !createTableSession.isPending) {
        console.log('No active table session found, creating one...');
        createTableSession.mutate();
        return;
      }

      if (activeSession) {
        const seatedTime = new Date(activeSession.seated_at || '').getTime();
        const FOUR_HOURS = 4 * 60 * 60 * 1000;
        
        // If the session is older than 4 hours, mark completed and create a new one
        if (Date.now() - seatedTime > FOUR_HOURS) {
          console.log('Active table session is older than 4 hours, completing it and starting new one...');
          await supabase
            .from('table_sessions')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', activeSession.id);
          
          refetchActiveSession();
          return;
        }

        // If the session is associated with an order, check if that order is completed/cancelled.
        // If it is, this session is stale (customer already ate and left/billed).
        if (activeSession.order_id) {
          const { data: orderData } = await supabase
            .from('orders')
            .select('status')
            .eq('id', activeSession.order_id)
            .single();

          if (orderData && (orderData.status === 'completed' || orderData.status === 'cancelled')) {
            console.log('Order associated with table session is completed/cancelled. Completing session...');
            await supabase
              .from('table_sessions')
              .update({ status: 'completed', completed_at: new Date().toISOString() })
              .eq('id', activeSession.id);
            
            refetchActiveSession();
          }
        }
      }
    };

    validateSession();
  }, [restaurantId, resolvedTableId, isDataLoading, activeSession]);

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
        () => { queryClient.invalidateQueries({ queryKey: ['enterprise_promotions', restaurantId] }); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'enterprise_promotions', filter: `restaurant_id=eq.${restaurantId}` },
        () => { queryClient.invalidateQueries({ queryKey: ['enterprise_promotions', restaurantId] }); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items', filter: `restaurant_id=eq.${restaurantId}` },
        () => { queryClient.invalidateQueries({ queryKey: ['menu_items', restaurantId] }); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `restaurant_id=eq.${restaurantId}` },
        () => { queryClient.invalidateQueries({ queryKey: ['categories', restaurantId] }); }
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
  const categoryObjects = useMemo(() => {
    return [
      { id: 'all', name: 'All', image_url: null },
      ...categories.map(c => ({ id: c.id, name: c.name, image_url: c.image_url }))
    ];
  }, [categories]);

  // Filter items
  const filteredItems = useMemo(() => {
    return availableMenuItems.filter((item) => {
      const matchesCategory = (() => {
        if (selectedCategory === 'All') return true;
        if (selectedCategory === 'Trending') return item.is_popular === true;
        if (selectedCategory === 'Chef Special') {
          return item.is_popular === true || 
                 (item.tags && item.tags.some(t => t.toLowerCase().includes('chef') || t.toLowerCase().includes('special')));
        }
        if (selectedCategory === 'Healthy') {
          return item.is_vegetarian === true || 
                 item.is_vegan === true || 
                 (item.tags && item.tags.some(t => t.toLowerCase().includes('healthy') || t.toLowerCase().includes('diet')));
        }
        if (selectedCategory === 'Spicy') {
          return item.spicy_level !== undefined && item.spicy_level !== null && item.spicy_level > 0;
        }
        return item.category?.name === selectedCategory;
      })();

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
    return displayOrders.find(
      (o) => o.status !== "completed" && o.status !== "cancelled"
    );
  }, [displayOrders]);

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

  // Trigger review modal when an order changes status to completed
  useEffect(() => {
    if (displayOrders.length === 0) return;

    displayOrders.forEach((order) => {
      const prevStatus = prevOrderStatusesRef.current[order.id];
      const currentStatus = order.status;

      if (prevStatus && prevStatus !== 'completed' && currentStatus === 'completed') {
        console.log(`[Review Trigger] Order ${order.id} status changed to completed! Triggering review modal...`);
        setReviewOrderId(order.id);
        setReviewImmediate(true);
      }

      // Update ref with current status
      prevOrderStatusesRef.current[order.id] = currentStatus;
    });

    // Populate initial statuses for newly loaded orders so we only trigger on transitions
    displayOrders.forEach((order) => {
      if (!prevOrderStatusesRef.current[order.id]) {
        prevOrderStatusesRef.current[order.id] = order.status;
      }
    });
  }, [displayOrders]);


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

    // Rate Limit Check
    if (!checkRateLimit(`order_submit_${restaurantId}_${resolvedTableId}`, RATE_LIMITS.ORDER_SUBMIT.maxAttempts, RATE_LIMITS.ORDER_SUBMIT.windowMs)) {
      const cooldown = getRemainingCooldown(`order_submit_${restaurantId}_${resolvedTableId}`);
      toast({
        title: 'Too many requests',
        description: `Please wait ${cooldown}s before placing another order.`,
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
      const result = await createOrder.mutateAsync({
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

      // Save order to localStorage
      if (result?.id) {
        addRecentOrderId(result.id);
        refreshRecentOrderIds();

        // Update table session with order details
        if (activeSession) {
          await supabase
            .from('table_sessions')
            .update({
              order_id: result.id,
              status: 'ordered',
              order_placed_at: new Date().toISOString()
            })
            .eq('id', activeSession.id);
          
          refetchActiveSession();
        }
      }

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

    // Rate Limit Check
    if (!checkRateLimit(`waiter_call_${restaurantId}_${resolvedTableId}`, RATE_LIMITS.WAITER_CALL.maxAttempts, RATE_LIMITS.WAITER_CALL.windowMs)) {
      const cooldown = getRemainingCooldown(`waiter_call_${restaurantId}_${resolvedTableId}`);
      toast({
        title: 'Too many requests',
        description: `Please wait ${cooldown}s before calling the waiter again.`,
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


  const isInvalidTable = dynamicTableId && !tableLoading && (!tableData || tableData.active === false);

  if (isInvalidTable) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-150 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="max-w-md w-full"
        >
          <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-[0_16px_48px_rgba(0,0,0,0.08)] rounded-3xl overflow-hidden">
            <CardContent className="p-8 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <motion.div
                  animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="w-full h-full rounded-2xl bg-destructive/10 dark:bg-destructive/20 flex items-center justify-center text-destructive"
                >
                  <AlertCircle className="w-10 h-10" />
                </motion.div>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full animate-ping" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Invalid or Inactive Table</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  This table is not valid or has been deactivated. Please ask the restaurant staff for assistance or try scanning the QR code again.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-2xl h-12 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-bold"
                onClick={() => setDynamicTableId('')}
              >
                Change Table
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (!restaurantId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-150 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="max-w-md w-full"
        >
          <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-[0_16px_48px_rgba(0,0,0,0.08)] rounded-3xl overflow-hidden">
            <CardContent className="p-8 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <motion.div
                  animate={{ scale: [1, 1.05, 1], y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="w-full h-full rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400"
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h.01"/><path d="M17 7h.01"/><path d="M7 17h.01"/><path d="M17 17h.01"/></svg>
                </motion.div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Invalid QR Code</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Please scan a valid QR code at your table to view the menu and start ordering.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
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
          <img src={cacheBustUrl(restaurant.banner_image_url)} alt="Banner" className="w-full h-44 object-cover" />
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
        {feedbackStats && feedbackStats.total > 0 && (
          <div className="flex items-center justify-center gap-1.5 mt-1.5 text-amber-500 font-bold text-sm">
            <span>★</span>
            <span>{feedbackStats.avgRating.toFixed(1)}</span>
            <span className="text-muted-foreground dark:text-zinc-500 font-normal text-xs">({feedbackStats.total} reviews)</span>
          </div>
        )}
        <p className="text-muted-foreground mt-2 text-sm">{restaurant?.description || 'Welcome!'}</p>
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
          categories={categoryObjects}
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 px-4 bg-zinc-50/50 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl"
        >
          <Search className="w-10 h-10 mx-auto text-zinc-400 dark:text-zinc-600 mb-3" />
          <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50 mb-1">No items found</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
            We couldn't find any items matching "{searchQuery}" in this category. Try adjusting your search query or category filter.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
            className="mt-4 text-xs font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Clear Filters
          </Button>
        </motion.div>
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
            restaurantId={restaurantId}
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

      {displayOrders.length === 0 ? (
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
            onClick={() => setCurrentView('search')}
          >
            Back to Menu
          </Button>
        </div>
      ) : (
        displayOrders.map((order) => (
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
      {restaurantId && (
        <Button
          className="mt-4 gap-2"
          variant="outline"
          onClick={() => {
            const params = new URLSearchParams({ r: restaurantId });
            if (resolvedTableId) params.set('table', resolvedTableId);
            navigate(`/feedback?${params.toString()}`);
          }}
        >
          <MessageSquare className="w-4 h-4" />
          Write a Review
        </Button>
      )}
    </div>
  );



  const renderNotifications = () => (
    <div className="space-y-4">
      <h3 className="font-extrabold text-xl tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">Notification History</h3>
      {tabNotifications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-30 stroke-1" />
          <p className="text-sm font-semibold">No notifications yet</p>
          <p className="text-xs mt-1">Alerts regarding your orders will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tabNotifications.map((item: any) => {
            const data = item.event_data || {};
            const isReady = item.event_type === 'notification_ready';
            const isPreparing = item.event_type === 'notification_preparing';
            const isDelivered = item.event_type === 'notification_delivered';

            return (
              <Card key={item.id} className="overflow-hidden border-zinc-150 dark:border-zinc-900/60 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                <CardContent className="p-4 flex gap-3.5 items-start">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    isReady ? 'bg-emerald-500/10 text-emerald-500' :
                    isPreparing ? 'bg-amber-500/10 text-amber-500' :
                    isDelivered ? 'bg-sky-500/10 text-sky-500' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                  }`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-50 truncate">{data.title || 'Alert'}</span>
                      <span className="text-[10px] text-zinc-400 font-medium">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">{data.message || ''}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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
        tableNumber={tableNumber || 'Select Table'}
        onSearchClick={() => setCurrentView('search')}
        primaryColor={primaryColor}
        branding={brandingConfig}
        restaurantId={restaurantId || undefined}
        tableId={resolvedTableId || undefined}
        notificationCount={tabNotifications.length}
        avgRating={feedbackStats?.avgRating}
        totalReviews={feedbackStats?.total}
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
            {currentView === 'search' && renderMenu()}
            {dynamicTableId && currentView === 'cart' && renderCart()}
            {dynamicTableId && currentView === 'orders' && renderOrders()}
            {currentView === 'notifications' && renderNotifications()}
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
      {dynamicTableId && currentView === 'search' && (
        <FloatingCartBar
          itemCount={getTotalItems()}
          totalPrice={cartPricing.finalTotal + (cartPricing.subtotal - cartPricing.totalDiscount) * (serviceChargeRate / 100)}
          currencySymbol={currencySymbol}
          onViewCart={() => setCurrentView('cart')}
        />
      )}


      {/* Floating Waiter FAB */}
      {restaurantId && resolvedTableId && (
        <WaiterCallFAB
          restaurantId={restaurantId}
          tableId={resolvedTableId}
          tableNumber={tableNumber || ''}
        />
      )}

      {/* Bottom Navigation — Always fixed and visible at the bottom of the viewport once loaded */}
      {!selectedItemForDetails && (
        <BottomNav
          currentView={currentView}
          onViewChange={setCurrentView}
          cartCount={getTotalItems()}
          orderCount={displayOrders.filter(o => o.status !== 'completed').length}
        />
      )}

      {/* Post-Order Review Prompt — triggers when order is completed */}
      {reviewOrderId && restaurantId && (
        <PostOrderReviewPrompt
          restaurantId={restaurantId}
          orderId={reviewOrderId}
          tableId={resolvedTableId}
          googleReviewUrl={restaurant?.google_review_url}
          delayMs={reviewImmediate ? 0 : 5000}
          immediate={reviewImmediate}
          onClose={() => setReviewOrderId(null)}
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
