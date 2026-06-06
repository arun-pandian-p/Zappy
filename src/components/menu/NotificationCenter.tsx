import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Bell, BellOff, X, ClipboardList, Info, CheckCircle, Clock, Volume2, WifiOff } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface NotificationCenterProps {
  restaurantId: string;
  tableId?: string;
  trigger?: React.ReactNode;
}

export function NotificationCenter({ restaurantId, tableId, trigger }: NotificationCenterProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const {
    isSupported,
    permissionStatus,
    isSubscribed,
    subscribeUser,
    unsubscribeUser,
    loading: pushLoading
  } = usePushNotifications(restaurantId, tableId);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch notification log from customer_events
  const { data: notifications = [], refetch, isLoading } = useQuery({
    queryKey: ['customer-notifications', restaurantId, tableId],
    queryFn: async () => {
      if (!restaurantId) return [];

      let query = supabase
        .from('customer_events')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .like('event_type', 'notification_%')
        .order('created_at', { ascending: false })
        .limit(20);

      // If tableId is specified, query table specific notifications
      if (tableId) {
        query = query.eq('table_id', tableId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!restaurantId,
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  const handlePushToggle = async (checked: boolean) => {
    try {
      if (checked) {
        await subscribeUser();
        toast({
          title: 'Notifications Enabled',
          description: 'You will now receive alerts for order updates and calls.',
        });
      } else {
        await unsubscribeUser();
        toast({
          title: 'Notifications Disabled',
          description: 'You will no longer receive background alerts.',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update push status. Please check browser permissions.',
        variant: 'destructive',
      });
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'notification_received':
        return <ClipboardList className="w-4 h-4 text-indigo-500" />;
      case 'notification_preparing':
        return <Clock className="w-4 h-4 text-amber-500 animate-pulse" />;
      case 'notification_ready':
        return <Bell className="w-4 h-4 text-emerald-500" />;
      case 'notification_delivered':
        return <CheckCircle className="w-4 h-4 text-sky-500" />;
      default:
        return <Info className="w-4 h-4 text-zinc-500" />;
    }
  };

  const formatTime = (timeStr: string) => {
    const d = new Date(timeStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon" className="relative rounded-2xl border-zinc-200 dark:border-zinc-800">
            <Bell className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950" />
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full max-w-[420px] p-6 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl flex flex-col border-zinc-200 dark:border-zinc-900 shadow-2xl">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
              Notifications
              {notifications.length > 0 && (
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {notifications.length}
                </Badge>
              )}
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Offline Banner */}
        {!isOnline && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            <WifiOff className="w-4 h-4" />
            <span>You are currently offline. Notifications may be delayed.</span>
          </div>
        )}

        {/* Push Notification Toggle Option */}
        {isSupported ? (
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-900 mb-6 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isSubscribed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-200/50 dark:bg-zinc-800 text-zinc-400'}`}>
                {isSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight text-zinc-800 dark:text-zinc-200">Push Notifications</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">Get alerts when order status changes</p>
              </div>
            </div>
            <Switch
              checked={isSubscribed}
              disabled={pushLoading}
              onCheckedChange={handlePushToggle}
            />
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 mb-6 text-amber-600 dark:text-amber-400 text-xs leading-relaxed">
            Push notifications are not supported on this browser or origin (requires HTTPS).
          </div>
        )}

        {/* Notifications List */}
        <ScrollArea className="flex-1 -mx-2 px-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-400">
              <span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading alerts...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 text-zinc-400">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-30 stroke-1" />
              <p className="text-sm font-semibold">All quiet for now</p>
              <p className="text-xs mt-1">Alerts regarding your orders will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {notifications.map((item: any) => {
                const data = item.event_data || {};
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-900/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-start gap-3.5 card-hover transition-all"
                  >
                    <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      {getEventIcon(item.event_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-xs font-black tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
                          {data.title || 'Notification'}
                        </p>
                        <span className="text-[10px] font-medium text-zinc-400 shrink-0">
                          {formatTime(item.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal line-clamp-2">
                        {data.message || item.description || ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
