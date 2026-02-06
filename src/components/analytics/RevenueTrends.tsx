import { useMemo } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OrderWithItems } from "@/hooks/useOrders";

interface RevenueTrendsProps {
  orders: OrderWithItems[];
  currencySymbol?: string;
  days?: number;
}

export function RevenueTrends({ orders, currencySymbol = "₹", days = 7 }: RevenueTrendsProps) {
  const trendData = useMemo(() => {
    const data: {
      date: string;
      displayDate: string;
      revenue: number;
      orders: number;
      avgOrder: number;
      change: number | null;
    }[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const displayDate = i === 0 ? "Today" : i === 1 ? "Yesterday" : format(date, "EEE, MMM d");
      
      // Filter orders for this day
      const dayOrders = orders.filter((order) => {
        if (!order.created_at) return false;
        const orderDate = format(new Date(order.created_at), "yyyy-MM-dd");
        return orderDate === dateStr;
      });
      
      // Calculate revenue (only completed/paid orders)
      const completedOrders = dayOrders.filter(
        (o) => o.status === "completed" || o.payment_status === "paid"
      );
      const revenue = completedOrders.reduce(
        (sum, o) => sum + Number(o.total_amount || 0),
        0
      );
      
      const avgOrder = completedOrders.length > 0 ? revenue / completedOrders.length : 0;
      
      data.push({
        date: dateStr,
        displayDate,
        revenue,
        orders: dayOrders.length,
        avgOrder,
        change: null, // Will be calculated after
      });
    }
    
    // Calculate day-over-day changes
    for (let i = 0; i < data.length - 1; i++) {
      const current = data[i];
      const previous = data[i + 1];
      
      if (previous.revenue > 0) {
        current.change = ((current.revenue - previous.revenue) / previous.revenue) * 100;
      } else if (current.revenue > 0) {
        current.change = 100;
      }
    }
    
    return data;
  }, [orders, days]);

  const getTrendIcon = (change: number | null) => {
    if (change === null) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getChangeColor = (change: number | null) => {
    if (change === null) return "text-muted-foreground";
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Revenue Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold text-right">Revenue</TableHead>
                <TableHead className="font-semibold text-right">Orders</TableHead>
                <TableHead className="font-semibold text-right">Avg Order</TableHead>
                <TableHead className="font-semibold text-right">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trendData.map((row) => (
                <TableRow key={row.date} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{row.displayDate}</TableCell>
                  <TableCell className="text-right font-mono">
                    {currencySymbol}{row.revenue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{row.orders}</TableCell>
                  <TableCell className="text-right font-mono">
                    {currencySymbol}{row.avgOrder.toFixed(0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={`flex items-center justify-end gap-1 ${getChangeColor(row.change)}`}>
                      {getTrendIcon(row.change)}
                      <span className="text-sm">
                        {row.change !== null ? `${row.change > 0 ? "+" : ""}${row.change.toFixed(1)}%` : "--"}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
