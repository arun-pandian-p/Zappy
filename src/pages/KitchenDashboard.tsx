import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Volume2, VolumeX, Clock, Play, Check, ArrowLeft, Bell, RefreshCw, AlertCircle, UtensilsCrossed, XCircle, Eye } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSound, SOUNDS } from '@/hooks/useSound';
import { useOrders, useKitchenOrderActions, type OrderWithItems } from '@/hooks/useOrders';
import { usePendingWaiterCalls, useAcknowledgeWaiterCall, useResolveWaiterCall } from '@/hooks/useWaiterCalls';
import { useRestaurantDetails } from '@/hooks/useRestaurant';
import { TenantThemeProvider } from '@/components/admin/TenantThemeProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';

const VoicePlayer = ({ url }: { url: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(url);
    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    audioRef.current.addEventListener('ended', handleEnded);
    audioRef.current.addEventListener('pause', handlePause);
    audioRef.current.addEventListener('play', handlePlay);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.removeEventListener('pause', handlePause);
        audioRef.current.removeEventListener('play', handlePlay);
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [url]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={togglePlay}
      className="flex items-center gap-1.5 rounded-xl mt-1 py-1 h-8 bg-background border-warning/30 hover:bg-warning/10 text-xs font-semibold"
    >
      {isPlaying ? <VolumeX className="w-3.5 h-3.5 text-warning" /> : <Play className="w-3.5 h-3.5 text-warning fill-warning" />}
      <span>{isPlaying ? 'Pause Request' : 'Play Voice Request'}</span>
    </Button>
  );
};

const WaiterCallReasonRenderer = ({ reason }: { reason: string | null }) => {
  if (!reason) return <p className="text-sm mb-3">Assistance requested</p>;
  
  try {
    const parsed = JSON.parse(reason);
    if (parsed.type === 'voice' && parsed.url) {
      return (
        <div className="space-y-1.5 mb-3" onClick={(e) => e.stopPropagation()}>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">🎤 Voice Note Request</p>
          <VoicePlayer url={parsed.url} />
        </div>
      );
    }
    if (parsed.type === 'image' && parsed.url) {
      return (
        <div className="space-y-1.5 mb-3" onClick={(e) => e.stopPropagation()}>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">📷 Photo Attachment</p>
          <Dialog>
            <DialogTrigger asChild>
              <div className="relative group w-20 h-20 rounded-xl overflow-hidden border cursor-pointer bg-muted">
                <img src={parsed.url} alt="Dispute" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-4 h-4 text-white" />
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Photo Attachment</DialogTitle>
                <DialogDescription>
                  Customer uploaded photo for assistance.
                </DialogDescription>
              </DialogHeader>
              <img src={parsed.url} alt="Full Size" className="w-full h-auto rounded-lg max-h-[60vh] object-contain mx-auto" />
            </DialogContent>
          </Dialog>
        </div>
      );
    }
    return <p className="text-sm mb-3">{parsed.label || reason}</p>;
  } catch {
    return <p className="text-sm mb-3">{reason}</p>;
  }
};

import { usePrinter } from '@/hooks/usePrinter';
import { CancelOrderDialog } from '@/components/admin/CancelOrderDialog';
import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';

import { KitchenStationFilter } from '@/components/admin/KitchenStationFilter';
import { KitchenTVMode } from '@/components/admin/KitchenTVMode';
import { KitchenOrderCard } from '@/components/admin/KitchenOrderCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { WorkforceDashboard } from '@/components/admin/WorkforceDashboard';
import { WaiterManagement } from '@/components/admin/WaiterManagement';
import { ShiftLogs } from '@/components/admin/ShiftLogs';

interface KitchenDashboardProps {
  embedded?: boolean;
  restaurantId?: string;
}

const KitchenDashboard = ({ embedded = false, restaurantId: propRestaurantId }: KitchenDashboardProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, restaurantId: authRestaurantId, signOut } = useAuth();
  
  const urlRestaurantId = searchParams.get('r');
  const restaurantId = propRestaurantId || authRestaurantId || urlRestaurantId || undefined;
  const { data: restaurant } = useRestaurantDetails(restaurantId);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };
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

  // KDS UI State
  const [isTvMode, setIsTvMode] = useState(false);
  const [activeStation, setActiveStation] = useState<string>('all');
  const [isCallsDialogOpen, setIsCallsDialogOpen] = useState(false);

  const acknowledgeMutation = useAcknowledgeWaiterCall();
  const resolveMutation = useResolveWaiterCall();

  const handleAcknowledgeCall = (callId: string) => {
    acknowledgeMutation.mutate(
      { id: callId, userId: user?.id || '' },
      {
        onSuccess: () => toast({ title: 'Call Acknowledged', description: 'The customer has been notified.' }),
        onError: () => toast({ title: 'Error', description: 'Failed to acknowledge call.', variant: 'destructive' }),
      }
    );
  };

  const handleResolveCall = (callId: string) => {
    resolveMutation.mutate(
      { id: callId },
      {
        onSuccess: () => toast({ title: 'Call Resolved', description: 'The call has been marked as resolved.' }),
        onError: () => toast({ title: 'Error', description: 'Failed to resolve call.', variant: 'destructive' }),
      }
    );
  };

  // Extract all unique stations dynamically from orders
  const availableStations = useMemo(() => {
    const stationsSet = new Set<string>();
    orders.forEach((order) => {
      order.order_items?.forEach((item) => {
        if (item.kitchen_station) {
          stationsSet.add(item.kitchen_station.toLowerCase());
        }
      });
    });
    if (stationsSet.size === 0) {
      return ['kitchen', 'bar', 'dessert'];
    }
    return Array.from(stationsSet);
  }, [orders]);

  // Filter orders by active station
  const filteredOrders = useMemo(() => {
    if (activeStation === 'all') return orders;
    return orders
      .map((order) => {
        const itemsForStation = order.order_items?.filter(
          (item) => item.kitchen_station?.toLowerCase() === activeStation.toLowerCase()
        ) || [];
        return { ...order, order_items: itemsForStation };
      })
      .filter((order) => order.order_items.length > 0);
  }, [orders, activeStation]);

  // Filter orders by status
  const pendingOrders = useMemo(() => 
    filteredOrders.filter((o) => o.status === 'pending' || o.status === 'confirmed'), 
    [filteredOrders]
  );
  const preparingOrders = useMemo(() => 
    filteredOrders.filter((o) => o.status === 'preparing'), 
    [filteredOrders]
  );
  const readyOrders = useMemo(() => 
    filteredOrders.filter((o) => o.status === 'ready'), 
    [filteredOrders]
  );
  const servedOrders = useMemo(() => 
    filteredOrders.filter((o) => o.status === 'served'), 
    [filteredOrders]
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
      case 'billed': return 'bg-muted/50 text-muted-foreground border-muted/30 opacity-60';
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

  // OrderCard has been extracted to KitchenOrderCard component

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
    <TenantThemeProvider primaryColor={restaurant?.primary_color} secondaryColor={restaurant?.secondary_color}>
    <div className="min-h-screen bg-background">
      {/* Header - hidden when embedded */}
      {!embedded && (
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
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Station Filter */}
                {restaurantId && (
                  <KitchenStationFilter
                    activeStation={activeStation}
                    onChange={setActiveStation}
                    stations={availableStations}
                  />
                )}

                {/* TV Mode Toggle */}
                <KitchenTVMode
                  isTvMode={isTvMode}
                  onToggle={setIsTvMode}
                />

                <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2" disabled={isLoading}>
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button variant={isMuted ? 'outline' : 'default'} size="icon" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                <Button variant="outline" size="icon" onClick={handleLogout} title="Logout">
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Waiter Calls Alert - Visible even when embedded in admin panel */}
      <AnimatePresence>
        {waiterCallsCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onClick={() => setIsCallsDialogOpen(true)}
            className="bg-warning/10 border-b border-warning/20 px-4 py-2.5 cursor-pointer hover:bg-warning/20 transition-colors"
          >
            <div className={`${embedded ? 'px-2' : 'container mx-auto'} flex items-center justify-between text-warning`}>
              <div className="flex items-center gap-2">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                  <Bell className="w-4 h-4" />
                </motion.div>
                <span className="text-sm font-semibold">
                  {waiterCallsCount} waiter call{waiterCallsCount > 1 ? 's' : ''} pending
                </span>
              </div>
              <span className="text-xs font-bold underline flex items-center gap-1">
                View Details & Respond &rarr;
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waiter Calls Detail Dialog */}
      <Dialog open={isCallsDialogOpen} onOpenChange={setIsCallsDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto" aria-describedby="waiter-calls-desc">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning font-bold">
              <Bell className="w-5 h-5 text-warning" />
              Active Waiter Calls
            </DialogTitle>
            <DialogDescription id="waiter-calls-desc">
              Respond to client requests and mark them as acknowledged or resolved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {waiterCalls.map((call) => (
              <Card key={call.id} className="border-warning/30 bg-warning/5">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="font-bold border-warning/40 text-warning bg-warning/10">
                      Table {call.table?.table_number || 'Unknown'}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium">
                      {getTimeAgo(call.created_at)}
                    </span>
                  </div>
                  <WaiterCallReasonRenderer reason={call.reason} />
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 rounded-xl h-9 border-warning/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcknowledgeCall(call.id);
                      }}
                      disabled={acknowledgeMutation.isPending}
                    >
                      <AlertCircle className="w-4 h-4 mr-1.5" />
                      Acknowledge
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 rounded-xl h-9 bg-success hover:bg-success/90 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResolveCall(call.id);
                      }}
                      disabled={resolveMutation.isPending}
                    >
                      <Check className="w-4 h-4 mr-1.5" />
                      Resolve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className={`${isTvMode ? 'w-full max-w-full px-6 py-4 flex-1' : 'container mx-auto px-4 py-6'}`}>
        <Tabs defaultValue="kitchen" className="w-full space-y-4">
          <TabsList>
            <TabsTrigger value="kitchen">Kitchen Display</TabsTrigger>
            <TabsTrigger value="workforce">Workforce</TabsTrigger>
            <TabsTrigger value="waiters">Waiters</TabsTrigger>
            <TabsTrigger value="shifts">Shift Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="kitchen" className="m-0">
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
                    <div className="flex items-center gap-2 mb-4 border-b pb-2">
                      <motion.div
                        className={`w-3 h-3 rounded-full ${col.color}`}
                        animate={col.animate ? { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] } : col.spin ? { rotate: 360 } : {}}
                        transition={col.animate ? { duration: 1.5, repeat: Infinity } : col.spin ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
                      />
                      <h2 className={`font-bold ${isTvMode ? 'text-lg' : 'text-base'}`}>{col.title} ({col.orders.length})</h2>
                    </div>
                    <div className="space-y-4 mt-4">
                      <AnimatePresence mode="popLayout">
                        {col.orders.map((order) => (
                          <KitchenOrderCard
                            key={order.id}
                            order={order}
                            showActions={col.action}
                            isUpdating={isUpdating}
                            onStartPrep={handleStartPrep}
                            onMarkReady={handleMarkReady}
                            onMarkServed={handleMarkServed}
                            onCancelClick={(id, num) => setCancelOrder({ id, number: num })}
                            isTvMode={isTvMode}
                          />
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
          </TabsContent>

          <TabsContent value="workforce">
            {restaurantId ? <WorkforceDashboard restaurantId={restaurantId} /> : <p>Loading...</p>}
          </TabsContent>

          <TabsContent value="waiters">
            {restaurantId ? <WaiterManagement restaurantId={restaurantId} /> : <p>Loading...</p>}
          </TabsContent>

          <TabsContent value="shifts">
            {restaurantId ? <ShiftLogs restaurantId={restaurantId} /> : <p>Loading...</p>}
          </TabsContent>
        </Tabs>
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
    </TenantThemeProvider>
  );
};

export default KitchenDashboard;
