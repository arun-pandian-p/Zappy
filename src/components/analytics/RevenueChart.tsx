import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, subDays } from "date-fns";
import type { OrderWithItems } from "@/hooks/useOrders";

interface RevenueChartProps {
  orders: OrderWithItems[];
  currencySymbol?: string;
  days?: number;
}

export function RevenueChart({ orders, currencySymbol = "₹", days = 7 }: RevenueChartProps) {
  const chartData = useMemo(() => {
    const data: { date: string; revenue: number; orders: number }[] = [];
    
    // Create array of last N days
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const displayDate = format(date, "EEE");
      
      // Filter orders for this day
      const dayOrders = orders.filter((order) => {
        if (!order.created_at) return false;
        const orderDate = format(new Date(order.created_at), "yyyy-MM-dd");
        return orderDate === dateStr;
      });
      
      // Calculate revenue (only completed orders)
      const completedOrders = dayOrders.filter(
        (o) => o.status === "completed" || o.payment_status === "paid"
      );
      const revenue = completedOrders.reduce(
        (sum, o) => sum + Number(o.total_amount || 0),
        0
      );
      
      data.push({
        date: displayDate,
        revenue,
        orders: dayOrders.length,
      });
    }
    
    return data;
  }, [orders, days]);

  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = chartData.reduce((sum, d) => sum + d.orders, 0);

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Revenue Trend</CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {currencySymbol}{totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalOrders} orders in {days} days
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${currencySymbol}${value}`}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
