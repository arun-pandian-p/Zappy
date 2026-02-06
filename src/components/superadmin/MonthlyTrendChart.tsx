import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Restaurant = Tables<"restaurants">;

interface MonthlyTrendChartProps {
  restaurants: Restaurant[];
  currencySymbol?: string;
  months?: number;
}

export function MonthlyTrendChart({ 
  restaurants, 
  currencySymbol = "₹", 
  months = 6 
}: MonthlyTrendChartProps) {
  const chartData = useMemo(() => {
    const data: { month: string; tenants: number; revenue: number }[] = [];
    
    // Generate data for last N months
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const monthLabel = format(date, "MMM");
      
      // Count tenants created before end of this month
      const tenantsCount = restaurants.filter((r) => {
        if (!r.created_at) return false;
        return new Date(r.created_at) <= monthEnd;
      }).length;
      
      // Calculate revenue based on tier distribution
      const activeInMonth = restaurants.filter((r) => {
        if (!r.created_at) return false;
        const createdAt = new Date(r.created_at);
        return createdAt <= monthEnd && r.is_active;
      });
      
      const revenue = activeInMonth.reduce((sum, r) => {
        switch (r.subscription_tier) {
          case "pro": return sum + 999;
          case "enterprise": return sum + 2999;
          default: return sum;
        }
      }, 0);
      
      data.push({
        month: monthLabel,
        tenants: tenantsCount,
        revenue,
      });
    }
    
    return data;
  }, [restaurants, months]);

  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const currentTenants = chartData[chartData.length - 1]?.tenants || 0;

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Monthly Trends</CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {currencySymbol}{totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentTenants} tenants total
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
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
                formatter={(value: number, name: string) => {
                  if (name === "revenue") return [`${currencySymbol}${value.toLocaleString()}`, "Revenue"];
                  return [value, "Tenants"];
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="tenants"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                name="Tenants"
              />
              <Bar
                yAxisId="right"
                dataKey="revenue"
                fill="hsl(142, 76%, 36%)"
                radius={[4, 4, 0, 0]}
                name="Revenue"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
