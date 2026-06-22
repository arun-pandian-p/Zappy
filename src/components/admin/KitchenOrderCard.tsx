import { forwardRef } from 'react';
import { Clock, Play, Check, UtensilsCrossed, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { OrderWithItems } from '@/hooks/useOrders';

interface KitchenOrderCardProps {
  order: OrderWithItems;
  showActions?: 'start' | 'ready' | 'served';
  isUpdating: boolean;
  onStartPrep: (id: string) => void;
  onMarkReady: (id: string) => void;
  onMarkServed: (id: string) => void;
  onCancelClick: (id: string, number: number) => void;
  isTvMode?: boolean;
}

export const KitchenOrderCard = forwardRef<HTMLDivElement, KitchenOrderCardProps>(({
  order,
  showActions,
  isUpdating,
  onStartPrep,
  onMarkReady,
  onMarkServed,
  onCancelClick,
  isTvMode = false,
}, ref) => {
  const getPrepTimer = (order: OrderWithItems) => {
    if (order.status !== 'preparing' || !order.started_preparing_at) return null;
    const diff = Date.now() - new Date(order.started_preparing_at).getTime();
    const mins = Math.floor(diff / 60000);
    return mins;
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    return mins < 1 ? 'Just now' : `${mins}m ago`;
  };

  const isUrgent = (order: OrderWithItems) => {
    if (order.status !== 'pending' && order.status !== 'confirmed') return false;
    const diff = Date.now() - new Date(order.created_at || Date.now()).getTime();
    return diff > 10 * 60 * 1000; // >10 min
  };

  const checkOverdue = (order: OrderWithItems) => {
    if (order.status !== 'preparing' || !order.started_preparing_at) return false;
    const diff = Date.now() - new Date(order.started_preparing_at).getTime();
    return diff > 15 * 60 * 1000; // 15 mins limit
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': case 'confirmed': return 'bg-warning/10 text-warning border-warning/20';
      case 'preparing': return 'bg-info/10 text-info border-info/20';
      case 'ready': return 'bg-success/10 text-success border-success/20';
      case 'served': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const prepMins = getPrepTimer(order);
  const urgent = isUrgent(order);
  const overdue = checkOverdue(order);

  // TV mode font sizes
  const textTitleSize = isTvMode ? 'text-lg' : 'text-sm';
  const textBodySize = isTvMode ? 'text-base' : 'text-sm';
  const badgeSize = isTvMode ? 'text-sm px-2.5 py-1' : 'text-[10px]';
  const tableBadgeSize = isTvMode ? 'text-xl px-3 py-1.5' : 'text-base';
  const buttonHeight = isTvMode ? 'h-12 text-base' : 'h-9 text-sm';

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        borderColor: overdue 
          ? ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 1)', 'rgba(239, 68, 68, 0.2)']
          : undefined,
        borderWidth: overdue ? '2px' : undefined,
      }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ 
        type: 'spring', 
        stiffness: 500, 
        damping: 30,
        borderColor: overdue ? { repeat: Infinity, duration: 1.5 } : undefined
      }}
      className="w-full"
    >
      <Card className={`border-2 ${getStatusColor(order.status || 'pending')} overflow-hidden ${urgent ? 'ring-2 ring-destructive/50' : ''} ${overdue ? 'shadow-[0_0_15px_rgba(239,68,68,0.15)]' : ''}`}>
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
            <div className="flex flex-col gap-1">
              <div className="text-lg font-black tracking-tight text-foreground">
                {order.token_no ? `TOKEN ${order.token_no}` : `TOKEN #${String(order.order_number).padStart(3, '0')}`}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={`font-bold ${tableBadgeSize}`}>
                  Table {order.table?.table_number || 'N/A'}
                </Badge>
                {order.seat_number && (
                  <Badge variant="secondary" className="font-bold">
                    Seat {order.seat_number}
                  </Badge>
                )}
                {urgent && <Badge variant="destructive" className={badgeSize}>URGENT</Badge>}
                {overdue && <Badge variant="destructive" className={`${badgeSize} animate-pulse`}>OVERDUE</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {prepMins !== null && (
                <Badge variant="secondary" className={`${isTvMode ? 'text-xs px-2' : 'text-[10px]'} ${overdue ? 'bg-destructive/10 text-destructive border-destructive/20' : ''}`}>
                  <Clock className="w-3 h-3 mr-0.5" />{prepMins}m
                </Badge>
              )}
              <span className={`flex items-center gap-1 ${isTvMode ? 'text-sm' : ''}`}>
                <Clock className="w-3 h-3" />
                {getTimeAgo(order.created_at || new Date().toISOString())}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2.5">
            {order.order_items?.map((item) => (
              <div key={item.id} className={textBodySize}>
                <div className="flex items-start gap-1">
                  <span className="font-bold shrink-0">{item.quantity}x</span>
                  <div className="flex-1">
                    <span className="font-medium">{item.name}</span>
                    {/* Show selected variants/addons */}
                    {item.selected_variants && Array.isArray(item.selected_variants) && (item.selected_variants as any[]).length > 0 && (
                      <span className="block text-xs text-info ml-2">
                        {(item.selected_variants as any[]).map((v: any) => v.name).join(', ')}
                      </span>
                    )}
                    {item.selected_addons && Array.isArray(item.selected_addons) && (item.selected_addons as any[]).length > 0 && (
                      <span className="block text-xs text-info ml-2">
                        + {(item.selected_addons as any[]).map((a: any) => a.name).join(', ')}
                      </span>
                    )}
                    {item.special_instructions && (
                      <span className="block text-xs text-muted-foreground mt-0.5 bg-muted/40 p-1 rounded">
                        Note: {item.special_instructions}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showActions === 'start' && (
            <div className="flex gap-2 pt-1">
              <Button className={`flex-1 ${buttonHeight}`} onClick={() => onStartPrep(order.id)} disabled={isUpdating}>
                <Play className="w-4 h-4 mr-2" />
                Start Prep
              </Button>
              <Button variant="outline" size="icon" className={`text-destructive hover:text-destructive shrink-0 ${isTvMode ? 'w-12 h-12' : 'w-9 h-9'}`} onClick={() => onCancelClick(order.id, order.order_number)}>
                <XCircle className="w-4.5 h-4.5" />
              </Button>
            </div>
          )}

          {showActions === 'ready' && (
            <div className="flex gap-2 pt-1">
              <Button className={`flex-1 bg-success hover:bg-success/90 ${buttonHeight}`} onClick={() => onMarkReady(order.id)} disabled={isUpdating}>
                <Check className="w-4 h-4 mr-2" />
                Mark Ready
              </Button>
              <Button variant="outline" size="icon" className={`text-destructive hover:text-destructive shrink-0 ${isTvMode ? 'w-12 h-12' : 'w-9 h-9'}`} onClick={() => onCancelClick(order.id, order.order_number)}>
                <XCircle className="w-4.5 h-4.5" />
              </Button>
            </div>
          )}

          {showActions === 'served' && (
            <Button className={`w-full bg-primary hover:bg-primary/90 pt-1 ${buttonHeight}`} onClick={() => onMarkServed(order.id)} disabled={isUpdating}>
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              Mark Served
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});
