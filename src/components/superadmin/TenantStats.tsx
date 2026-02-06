import { useMemo } from "react";
import { motion } from "framer-motion";
import { Building2, CheckCircle2, CreditCard, Crown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Tables } from "@/integrations/supabase/types";

type Restaurant = Tables<"restaurants">;

interface TenantStatsProps {
  restaurants: Restaurant[];
  totalRevenue?: number;
  currencySymbol?: string;
}

interface StatCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  index: number;
}

function StatCard({ label, value, subLabel, icon: Icon, iconColor, bgColor, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              {subLabel && (
                <p className="text-xs text-muted-foreground">{subLabel}</p>
              )}
            </div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: bgColor }}
            >
              <Icon className="w-6 h-6" style={{ color: iconColor }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function TenantStats({ restaurants, totalRevenue = 0, currencySymbol = "₹" }: TenantStatsProps) {
  const stats = useMemo(() => {
    const total = restaurants.length;
    const active = restaurants.filter((r) => r.is_active).length;
    const tiers = {
      free: restaurants.filter((r) => r.subscription_tier === "free").length,
      pro: restaurants.filter((r) => r.subscription_tier === "pro").length,
      enterprise: restaurants.filter((r) => r.subscription_tier === "enterprise").length,
    };
    
    // Calculate MRR based on tiers (example pricing)
    const mrr = tiers.free * 0 + tiers.pro * 999 + tiers.enterprise * 2999;
    
    return { total, active, tiers, mrr };
  }, [restaurants]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        label="Total Tenants"
        value={stats.total}
        subLabel={`${stats.active} active`}
        icon={Building2}
        iconColor="#3b82f6"
        bgColor="#3b82f610"
        index={0}
      />
      <StatCard
        label="Active Tenants"
        value={stats.active}
        subLabel={`${((stats.active / Math.max(stats.total, 1)) * 100).toFixed(0)}% of total`}
        icon={CheckCircle2}
        iconColor="#10b981"
        bgColor="#10b98110"
        index={1}
      />
      <StatCard
        label="Pro Plans"
        value={stats.tiers.pro}
        subLabel="₹999/mo each"
        icon={CreditCard}
        iconColor="#8b5cf6"
        bgColor="#8b5cf610"
        index={2}
      />
      <StatCard
        label="Enterprise"
        value={stats.tiers.enterprise}
        subLabel="₹2,999/mo each"
        icon={Crown}
        iconColor="#f59e0b"
        bgColor="#f59e0b10"
        index={3}
      />
      <StatCard
        label="Platform Revenue"
        value={`${currencySymbol}${totalRevenue.toLocaleString()}`}
        subLabel={`MRR: ${currencySymbol}${stats.mrr.toLocaleString()}`}
        icon={TrendingUp}
        iconColor="#10b981"
        bgColor="#10b98110"
        index={4}
      />
    </div>
  );
}
