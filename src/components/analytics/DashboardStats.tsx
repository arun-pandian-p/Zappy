import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { format, subDays, isToday, isYesterday } from "date-fns";
import type { OrderWithItems } from "@/hooks/useOrders";

interface DashboardStatsProps {
  orders: OrderWithItems[];
  currencySymbol?: string;
}

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  iconColor: string;
  index: number;
}

function StatCard({ label, value, change, icon: Icon, iconColor, index }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {change !== undefined && (
                <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{Math.abs(change).toFixed(1)}% vs yesterday</span>
                </div>
              )}
              {/* Micro sparkline */}
              <div className="flex items-end gap-0.5 h-3 mt-1">
                {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full"
                    style={{ height: `${h}%`, backgroundColor: `${iconColor}40` }}
                  />
                ))}
              </div>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${iconColor}15` }}
            >
              <Icon className="w-5 h-5" style={{ color: iconColor }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DashboardStats({ orders, currencySymbol = "₹" }: DashboardStatsProps) {
  const stats = useMemo(() => {
    const today = new Date();
    const yesterday = subDays(today, 1);
    
    // Today's orders
    const todayOrders = orders.filter((o) => {
      if (!o.created_at) return false;
      return isToday(new Date(o.created_at));
    });
    
    // Yesterday's orders
    const yesterdayOrders = orders.filter((o) => {
      if (!o.created_at) return false;
      return isYesterday(new Date(o.created_at));
    });
    
    // Calculate revenues
    const todayRevenue = todayOrders
      .filter((o) => o.status === "completed" || o.payment_status === "paid")
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      
    const yesterdayRevenue = yesterdayOrders
      .filter((o) => o.status === "completed" || o.payment_status === "paid")
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    
    // Calculate changes
    const revenueChange = yesterdayRevenue > 0
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
      : todayRevenue > 0 ? 100 : 0;
      
    const orderChange = yesterdayOrders.length > 0
      ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100
      : todayOrders.length > 0 ? 100 : 0;
    
    // Average order value
    const avgOrderValue = todayOrders.length > 0
      ? todayRevenue / todayOrders.length
      : 0;
    
    // Avg prep time (mock for now, will be calculated from order timing later)
    const avgPrepTime = todayOrders.length > 0 ? 12 : 0;
    
    return {
      todayRevenue,
      todayOrders: todayOrders.length,
      avgOrderValue,
      avgPrepTime,
      revenueChange,
      orderChange,
    };
  }, [orders]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Today's Revenue"
        value={`${currencySymbol}${stats.todayRevenue.toLocaleString()}`}
        change={stats.revenueChange}
        icon={DollarSign}
        iconColor="#10b981"
        index={0}
      />
      <StatCard
        label="Orders Today"
        value={stats.todayOrders}
        change={stats.orderChange}
        icon={ShoppingCart}
        iconColor="#3b82f6"
        index={1}
      />
      <StatCard
        label="Avg Order Value"
        value={`${currencySymbol}${stats.avgOrderValue.toFixed(0)}`}
        icon={TrendingUp}
        iconColor="#f59e0b"
        index={2}
      />
      <StatCard
        label="Avg Prep Time"
        value={stats.avgPrepTime > 0 ? `${stats.avgPrepTime} min` : "--"}
        icon={Clock}
        iconColor="#8b5cf6"
        index={3}
      />
    </div>
  );
}
