import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell } from "recharts";
import { Eye, ShoppingCart, Package, TrendingDown } from "lucide-react";
import { useEventStats } from "@/hooks/useCustomerEvents";

interface CustomerBehaviorPanelProps {
  restaurantId: string;
}

export function CustomerBehaviorPanel({ restaurantId }: CustomerBehaviorPanelProps) {
  const { data: stats } = useEventStats(restaurantId, 7);

  const funnelData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Menu Views", value: stats.menuViews, fill: "hsl(var(--primary))" },
      { name: "Cart Adds", value: stats.cartAdds, fill: "hsl(var(--info))" },
      { name: "Orders", value: stats.ordersPlaced, fill: "hsl(var(--success))" },
    ];
  }, [stats]);

  const metricCards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: "Menu Views", value: stats.menuViews, icon: Eye, color: "hsl(var(--primary))" },
      { label: "Cart Adds", value: stats.cartAdds, icon: ShoppingCart, color: "hsl(var(--info))" },
      { label: "Orders Placed", value: stats.ordersPlaced, icon: Package, color: "hsl(var(--success))" },
      { label: "Conversion Rate", value: `${stats.conversionRate}%`, icon: TrendingDown, color: "hsl(var(--warning))" },
    ];
  }, [stats]);

  if (!stats) return null;

  return (
    <div className="space-y-4">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metricCards.map((metric) => (
          <Card key={metric.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${metric.color}15` }}>
                <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <p className="text-lg font-bold">{metric.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conversion funnel */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Conversion Funnel (7 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 80, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 13 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
