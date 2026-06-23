import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats } from "@/components/analytics/DashboardStats";
import { RevenueChart } from "@/components/analytics/RevenueChart";
import { RevenueTrends } from "@/components/analytics/RevenueTrends";
import { CustomerBehaviorPanel } from "@/components/analytics/CustomerBehaviorPanel";
import { OrdersTable } from "@/components/analytics/OrdersTable";
import { TableSessionTimers } from "@/components/admin/TableSessionTimers";
import { MenuPreviewCard } from "@/components/admin/MenuPreviewCard";

interface OverviewTabProps {
  orders: any[];
  currencySymbol: string;
  user: any;
  restaurant: any;
  role: string | null;
  restaurantId: string;
  menuItems: any[];
  onViewAllOrders: () => void;
  restaurantsLoading?: boolean;
}

export function OverviewTab({
  orders,
  currencySymbol,
  user,
  restaurant,
  role,
  restaurantId,
  menuItems,
  onViewAllOrders,
  restaurantsLoading = false,
}: OverviewTabProps) {
  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <DashboardStats orders={orders} currencySymbol={currencySymbol} />
      
      {/* Active Table Sessions & Popular Items first */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TableSessionTimers restaurantId={restaurantId} />
        </div>
        <div className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">
                Popular Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {menuItems?.slice(0, 2).map((item, index) => (
                  <MenuPreviewCard
                    key={item.id}
                    item={item}
                    currencySymbol={currencySymbol}
                    index={index}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Orders table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <OrdersTable
            orders={orders}
            currencySymbol={currencySymbol}
            onViewAll={onViewAllOrders}
            limit={5}
            showFilters={false}
          />
        </div>
      </div>

      {/* Visualizations last */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart orders={orders} currencySymbol={currencySymbol} days={7} />
        <RevenueTrends orders={orders} currencySymbol={currencySymbol} days={7} />
      </div>
      <CustomerBehaviorPanel restaurantId={restaurantId} />
    </motion.div>
  );
}

export default OverviewTab;
