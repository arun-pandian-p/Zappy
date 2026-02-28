import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Bell, Search, Volume2, VolumeX, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTables } from '@/hooks/useTables';
import { useOrders } from '@/hooks/useOrders';
import { usePendingWaiterCalls, useAcknowledgeWaiterCall, useResolveWaiterCall } from '@/hooks/useWaiterCalls';
import { useRestaurants } from '@/hooks/useRestaurant';
import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';

const DEMO_RESTAURANT_ID = '00000000-0000-0000-0000-000000000001';

const WaiterDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { restaurantId: authRestaurantId, signOut } = useAuth();
  const { data: restaurants = [] } = useRestaurants();

  const urlRestaurantId = searchParams.get('r');
  const autoRestaurantId = restaurants[0]?.id;
  const restaurantId = authRestaurantId || urlRestaurantId || autoRestaurantId || DEMO_RESTAURANT_ID;

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const { data: tables = [], isLoading: tablesLoading } = useTables(restaurantId);
  const { data: orders = [], isLoading: ordersLoading } = useOrders(restaurantId);
  const { data: pendingCalls = [], isLoading: callsLoading } = usePendingWaiterCalls(restaurantId);

  const acknowledgeMutation = useAcknowledgeWaiterCall();
  const resolveMutation = useResolveWaiterCall();

  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const prevCallCount = useRef(pendingCalls.length);

  // Sound alert for new waiter calls
  useEffect(() => {
    if (!isMuted && pendingCalls.length > prevCallCount.current) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch {}
    }
    prevCallCount.current = pendingCalls.length;
  }, [pendingCalls.length, isMuted]);

  const filteredTables = tables.filter((table) =>
    table.table_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAcknowledgeCall = (callId: string) => {
    acknowledgeMutation.mutate(
      { id: callId, userId: 'waiter' },
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

  const getTableStatus = (table: typeof tables[0]) => {
    const tableOrder = orders.find((o) => o.table_id === table.id && o.status !== 'completed' && o.status !== 'cancelled');
    if (tableOrder) return tableOrder.status || 'occupied';
    return table.status || 'available';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
      case 'idle':
        return 'bg-muted border-muted';
      case 'occupied':
        return 'bg-primary/10 border-primary/30';
      case 'pending':
        return 'bg-warning/10 border-warning/30';
      case 'preparing':
        return 'bg-info/10 border-info/30';
      case 'ready':
        return 'bg-success/10 border-success/30';
      case 'served':
        return 'bg-accent/30 border-accent';
      default:
        return 'bg-muted border-muted';
    }
  };

  const getTimeAgo = (date: string | null) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    return mins < 1 ? 'Just now' : `${mins}m ago`;
  };

  const isLoading = tablesLoading || ordersLoading || callsLoading;

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
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <h1 className="font-bold">Waiter Dashboard</h1>
                  <p className="text-xs text-muted-foreground">
                    {isLoading ? 'Loading...' : `${pendingCalls.length} pending calls · ${tables.length} tables`}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <Button variant="outline" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Waiter Calls */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-warning" />
                  Waiter Calls
                  {pendingCalls.length > 0 && (
                    <Badge variant="destructive" className="ml-auto">{pendingCalls.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {callsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <AnimatePresence>
                    {pendingCalls.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No pending calls</p>
                      </div>
                    ) : (
                      pendingCalls.map((call) => (
                        <motion.div
                          key={call.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                        >
                          <Card className="border-warning/30 bg-warning/5">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline" className="font-bold">
                                  {(call as any).table?.table_number || 'Unknown'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {getTimeAgo(call.created_at)}
                                </span>
                              </div>
                              <p className="text-sm mb-3">{call.reason || 'Assistance requested'}</p>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleAcknowledgeCall(call.id)}
                                  disabled={acknowledgeMutation.isPending}
                                >
                                  <AlertCircle className="w-4 h-4 mr-1" />
                                  Acknowledge
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1 bg-success hover:bg-success/90"
                                  onClick={() => handleResolveCall(call.id)}
                                  disabled={resolveMutation.isPending}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Resolve
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tables Overview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Tables Overview</CardTitle>
                  <div className="relative w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tables..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {tablesLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {filteredTables.map((table) => {
                        const status = getTableStatus(table);
                        const tableOrder = orders.find(
                          (o) => o.table_id === table.id && o.status !== 'completed' && o.status !== 'cancelled'
                        );

                        return (
                          <motion.div
                            key={table.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Card className={`cursor-pointer card-hover border-2 ${getStatusColor(status)}`}>
                              <CardContent className="p-4 text-center">
                                <h3 className="font-bold text-lg mb-1">{table.table_number}</h3>
                                <Badge variant="secondary" className="text-xs mb-2">
                                  {table.capacity || 4} seats
                                </Badge>
                                <p className="text-xs text-muted-foreground capitalize">{status}</p>
                                {tableOrder && (
                                  <div className="mt-2 pt-2 border-t">
                                    <p className="text-xs font-medium">
                                      ₹{Number(tableOrder.total_amount || 0).toFixed(0)}
                                    </p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
                      {[
                        { status: 'available', label: 'Available', color: 'bg-muted' },
                        { status: 'occupied', label: 'Occupied', color: 'bg-primary' },
                        { status: 'pending', label: 'Order Pending', color: 'bg-warning' },
                        { status: 'preparing', label: 'Preparing', color: 'bg-info' },
                        { status: 'ready', label: 'Ready', color: 'bg-success' },
                      ].map(({ status, label, color }) => (
                        <div key={status} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${color}`} />
                          <span className="text-xs text-muted-foreground">{label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WaiterDashboard;
