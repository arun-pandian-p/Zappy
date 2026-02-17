import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Volume2, VolumeX, Clock, Play, Check, ArrowLeft, Bell, RefreshCw, AlertCircle, UtensilsCrossed, XCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSound, SOUNDS } from '@/hooks/useSound';
import { useOrders, useKitchenOrderActions, type OrderWithItems } from '@/hooks/useOrders';
import { usePendingWaiterCalls } from '@/hooks/useWaiterCalls';
import { useRestaurants } from '@/hooks/useRestaurant';
import { usePrinter } from '@/hooks/usePrinter';
import { CancelOrderDialog } from '@/components/admin/CancelOrderDialog';
// Demo restaurant ID - fallback if no restaurant in DB
const DEMO_RESTAURANT_ID = '00000000-0000-0000-0000-000000000001';

interface KitchenDashboardProps {
  embedded?: boolean;
  restaurantId?: string;
}

const KitchenDashboard = ({ embedded = false, restaurantId: propRestaurantId }: KitchenDashboardProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Auto-detect restaurant if none provided
  const { data: restaurants = [], isLoading: restaurantsLoading } = useRestaurants();
  const urlRestaurantId = searchParams.get('r');
  const autoRestaurantId = restaurants[0]?.id;
  const restaurantId = propRestaurantId || urlRestaurantId || autoRestaurantId || DEMO_RESTAURANT_ID;
  const { toast } = useToast();

  // Fetch orders with real-time subscription
  const { data: orders = [], isLoading, error, refetch } = useOrders(
    restaurantId,
    ['pending', 'confirmed', 'preparing', 'ready', 'served']
  );

  // Fetch pending waiter calls
  const { data: waiterCalls = [] } = usePendingWaiterCalls(restaurantId);

  // Kitchen actions
  const { startPreparing, markReady, markServed, isLoading: isUpdating } = useKitchenOrderActions(restaurantId);

  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [cancelOrder, setCancelOrder] = useState<{ id: string; number: number } | null>(null);
  const { play: playNewOrderSound, isMuted, toggleMute } = useSound(SOUNDS.NEW_ORDER);
  const { play: playWaiterCallSound } = useSound(SOUNDS.WAITER_CALL);

  // Filter orders by status
  const pendingOrders = useMemo(() => 
    orders.filter((o) => o.status === 'pending' || o.status === 'confirmed'), 
    [orders]
  );
  const preparingOrders = useMemo(() => 
    orders.filter((o) => o.status === 'preparing'), 
    [orders]
  );
  const readyOrders = useMemo(() => 
    orders.filter((o) => o.status === 'ready'), 
    [orders]
  );
  const servedOrders = useMemo(() => 
    orders.filter((o) => o.status === 'served'), 
    [orders]
  );

  const waiterCallsCount = waiterCalls.length;

  // Play sound on new orders
  useEffect(() => {
    const currentPendingCount = pendingOrders.length;
    if (currentPendingCount > lastOrderCount && !isMuted && lastOrderCount > 0) {
      playNewOrderSound();
      toast({
        title: '🔔 New Order!',
        description: `${currentPendingCount - lastOrderCount} new order(s) received`,
      });
    }
    setLastOrderCount(currentPendingCount);
  }, [pendingOrders.length, lastOrderCount, isMuted, playNewOrderSound, toast]);

  // Play waiter call sound
  useEffect(() => {
    if (waiterCallsCount > 0 && !isMuted) {
      playWaiterCallSound();
    }
  }, [waiterCallsCount, isMuted, playWaiterCallSound]);

  const { isConnected: printerConnected, printKitchenOrder } = usePrinter(restaurantId);

  const handleStartPrep = useCallback(async (orderId: string) => {
    try {
      await startPreparing(orderId);
      toast({ title: 'Order Started', description: 'Order is now being prepared.' });

      // Auto-print KOT if printer is connected
      if (printerConnected) {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          const kotItems = order.order_items?.map(item => ({
            name: item.name,
            quantity: item.quantity,
            notes: item.special_instructions || undefined,
          })) || [];
          try {
            await printKitchenOrder(
              String(order.order_number),
              order.table?.table_number || 'N/A',
              kotItems,
              order.id
            );
            toast({ title: 'KOT Printed', description: 'Kitchen order ticket sent to printer.' });
          } catch {
            toast({ title: 'KOT Print Failed', description: 'Order started but ticket failed to print.', variant: 'destructive' });
          }
        }
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update order status.', variant: 'destructive' });
    }
  }, [startPreparing, toast, printerConnected, printKitchenOrder, orders]);

  const handleMarkReady = useCallback(async (orderId: string) => {
    try {
      await markReady(orderId);
      toast({ title: 'Order Ready', description: 'Order is ready for serving.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update order status.', variant: 'destructive' });
    }
  }, [markReady, toast]);

  const handleMarkServed = useCallback(async (orderId: string) => {
    try {
      await markServed(orderId);
      toast({ title: 'Order Served', description: 'Order has been served.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update order status.', variant: 'destructive' });
    }
  }, [markServed, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': case 'confirmed': return 'bg-warning/10 text-warning border-warning/20';
      case 'preparing': return 'bg-info/10 text-info border-info/20';
      case 'ready': return 'bg-success/10 text-success border-success/20';
      case 'served': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    return mins < 1 ? 'Just now' : `${mins}m ago`;
  };

  const getPrepTimer = (order: OrderWithItems) => {
    if (order.status !== 'preparing' || !order.started_preparing_at) return null;
    const diff = Date.now() - new Date(order.started_preparing_at).getTime();
    const mins = Math.floor(diff / 60000);
    return mins;
  };

  const isUrgent = (order: OrderWithItems) => {
    if (order.status !== 'pending' && order.status !== 'confirmed') return false;
    const diff = Date.now() - new Date(order.created_at || Date.now()).getTime();
    return diff > 10 * 60 * 1000; // >10 min
  };

  const OrderCard = ({ order, showActions }: { order: OrderWithItems; showActions?: 'start' | 'ready' | 'served' }) => {
    const prepMins = getPrepTimer(order);
    const urgent = isUrgent(order);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <Card className={`border-2 ${getStatusColor(order.status || 'pending')} overflow-hidden ${urgent ? 'ring-2 ring-destructive/50' : ''}`}>
          {(order.status === 'pending' || order.status === 'confirmed') && (
            <motion.div
              className={`h-1 ${urgent ? 'bg-destructive' : 'bg-warning'}`}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 600, ease: 'linear' }}
            />
          )}
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-base font-bold">
                  {order.table?.table_number || 'N/A'}
                </Badge>
                <span className="text-xs text-muted-foreground">#{order.order_number}</span>
                {urgent && <Badge variant="destructive" className="text-[10px]">URGENT</Badge>}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {prepMins !== null && (
                  <Badge variant="secondary" className="text-[10px]">
                    <Clock className="w-3 h-3 mr-0.5" />{prepMins}m
                  </Badge>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {getTimeAgo(order.created_at || new Date().toISOString())}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {order.order_items?.map((item) => (
                <div key={item.id} className="text-sm">
                  <span>
                    <span className="font-medium">{item.quantity}x</span> {item.name}
                    {/* Show selected variants/addons */}
                    {item.selected_variants && Array.isArray(item.selected_variants) && (item.selected_variants as any[]).length > 0 && (
                      <span className="block text-xs text-info ml-4">
                        {(item.selected_variants as any[]).map((v: any) => v.name).join(', ')}
                      </span>
                    )}
                    {item.selected_addons && Array.isArray(item.selected_addons) && (item.selected_addons as any[]).length > 0 && (
                      <span className="block text-xs text-info ml-4">
                        + {(item.selected_addons as any[]).map((a: any) => a.name).join(', ')}
                      </span>
                    )}
                    {item.special_instructions && (
                      <span className="block text-xs text-muted-foreground">
                        Note: {item.special_instructions}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {showActions === 'start' && (
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => handleStartPrep(order.id)} disabled={isUpdating}>
                  <Play className="w-4 h-4 mr-2" />
                  Start Prep
                </Button>
                <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => setCancelOrder({ id: order.id, number: order.order_number })}>
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            )}

            {showActions === 'ready' && (
              <div className="flex gap-2">
                <Button className="flex-1 bg-success hover:bg-success/90" onClick={() => handleMarkReady(order.id)} disabled={isUpdating}>
                  <Check className="w-4 h-4 mr-2" />
                  Mark Ready
                </Button>
                <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => setCancelOrder({ id: order.id, number: order.order_number })}>
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            )}

            {showActions === 'served' && (
              <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => handleMarkServed(order.id)} disabled={isUpdating}>
                <UtensilsCrossed className="w-4 h-4 mr-2" />
                Mark Served
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-lg font-semibold mb-2">Failed to load orders</h2>
            <p className="text-muted-foreground mb-4">
              {!restaurantId 
                ? 'No restaurant ID provided. Please access this page with ?r=your-restaurant-id'
                : 'Unable to connect to the database. Please try again.'}
            </p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const columns = [
    { title: 'Pending', orders: pendingOrders, color: 'bg-warning', action: 'start' as const, animate: true },
    { title: 'Preparing', orders: preparingOrders, color: 'bg-info', action: 'ready' as const, spin: true },
    { title: 'Ready', orders: readyOrders, color: 'bg-success', action: 'served' as const },
    { title: 'Served', orders: servedOrders, color: 'bg-primary', action: undefined },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/roles')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <ChefHat className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <h1 className="font-bold">Kitchen Display</h1>
                  <p className="text-xs text-muted-foreground">
                    {isLoading ? 'Loading...' : `${pendingOrders.length} pending • ${preparingOrders.length} preparing • ${readyOrders.length} ready`}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2" disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button variant={isMuted ? 'outline' : 'default'} size="icon" onClick={toggleMute}>
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Waiter Calls Alert */}
      <AnimatePresence>
        {waiterCallsCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-warning/10 border-b border-warning/20 px-4 py-2"
          >
            <div className="container mx-auto flex items-center gap-2 text-warning">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                <Bell className="w-4 h-4" />
              </motion.div>
              <span className="text-sm font-medium">
                {waiterCallsCount} waiter call{waiterCallsCount > 1 ? 's' : ''} pending
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - 4 columns */}
      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-6 bg-muted rounded animate-pulse w-32" />
                <Card className="border-dashed">
                  <CardContent className="py-8">
                    <div className="h-20 bg-muted rounded animate-pulse" />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {columns.map((col) => (
              <div key={col.title}>
                <div className="flex items-center gap-2 mb-4">
                  <motion.div
                    className={`w-3 h-3 rounded-full ${col.color}`}
                    animate={col.animate ? { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] } : col.spin ? { rotate: 360 } : {}}
                    transition={col.animate ? { duration: 1.5, repeat: Infinity } : col.spin ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
                  />
                  <h2 className="font-semibold">{col.title} ({col.orders.length})</h2>
                </div>
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {col.orders.map((order) => (
                      <OrderCard key={order.id} order={order} showActions={col.action} />
                    ))}
                  </AnimatePresence>
                  {col.orders.length === 0 && (
                    <Card className="border-dashed">
                      <CardContent className="py-8 text-center text-muted-foreground text-sm">
                        No {col.title.toLowerCase()} orders
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      {/* Cancel Order Dialog */}
      {cancelOrder && (
        <CancelOrderDialog
          open={!!cancelOrder}
          onOpenChange={(open) => !open && setCancelOrder(null)}
          orderId={cancelOrder.id}
          orderNumber={cancelOrder.number}
        />
      )}
    </div>
  );
};

export default KitchenDashboard;
