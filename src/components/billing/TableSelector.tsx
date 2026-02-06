import { motion } from "framer-motion";
import { Table2, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { OrderWithItems } from "@/hooks/useOrders";

interface TableSelectorProps {
  orders: OrderWithItems[];
  selectedOrderId?: string;
  onSelectOrder: (order: OrderWithItems) => void;
  currencySymbol?: string;
}

export function TableSelector({
  orders,
  selectedOrderId,
  onSelectOrder,
  currencySymbol = "₹",
}: TableSelectorProps) {
  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    return mins < 1 ? "Now" : `${mins}m`;
  };

  return (
    <Card className="h-full border-0 bg-muted/30">
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Table2 className="w-4 h-4" />
            Tables ({orders.length})
          </h3>
        </div>

        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="p-2 space-y-2">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedOrderId === order.id
                      ? "border-primary bg-primary/5 shadow-md"
                      : "hover:border-primary/50"
                  )}
                  onClick={() => onSelectOrder(order)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge
                        variant={selectedOrderId === order.id ? "default" : "outline"}
                        className="text-base font-bold"
                      >
                        {order.table?.table_number || "N/A"}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeAgo(order.created_at || new Date().toISOString())}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          #{order.order_number}
                        </span>
                        <span className="font-semibold text-primary">
                          {currencySymbol}
                          {Number(order.total_amount || 0).toFixed(0)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {order.order_items?.length || 0} items
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {orders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Table2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No pending bills</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default TableSelector;
