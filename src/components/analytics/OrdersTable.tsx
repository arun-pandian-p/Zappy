import { useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Clock, CheckCircle2, AlertCircle, ChefHat, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrderWithItems, OrderStatus } from "@/hooks/useOrders";

interface OrdersTableProps {
  orders: OrderWithItems[];
  currencySymbol?: string;
  onViewAll?: () => void;
  limit?: number;
  showFilters?: boolean;
}

const statusConfig: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  confirmed: { label: "Confirmed", variant: "default", icon: CheckCircle2 },
  preparing: { label: "Preparing", variant: "default", icon: ChefHat },
  ready: { label: "Ready", variant: "default", icon: CheckCircle2 },
  served: { label: "Served", variant: "outline", icon: CheckCircle2 },
  completed: { label: "Completed", variant: "outline", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", variant: "destructive", icon: AlertCircle },
};

export function OrdersTable({ 
  orders, 
  currencySymbol = "₹", 
  onViewAll, 
  limit = 10,
  showFilters = false
}: OrdersTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const filteredOrders = useMemo(() => {
    let filtered = orders;
    
    if (statusFilter !== "all") {
      filtered = orders.filter((o) => o.status === statusFilter);
    }
    
    return filtered.slice(0, limit);
  }, [orders, statusFilter, limit]);

  const getWaitTime = (order: OrderWithItems) => {
    if (!order.created_at) return "--";
    return formatDistanceToNow(new Date(order.created_at), { addSuffix: false });
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
          <div className="flex items-center gap-2">
            {showFilters && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            )}
            {onViewAll && (
              <Button variant="ghost" size="sm" onClick={onViewAll}>
                View All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No orders yet</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Order #</TableHead>
                  <TableHead className="font-semibold">Table</TableHead>
                  <TableHead className="font-semibold">Items</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Wait Time</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const status = order.status as OrderStatus;
                  const config = statusConfig[status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  
                  return (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono font-medium">
                        #{order.order_number}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {order.table?.table_number || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {order.order_items
                            ?.map((item) => `${item.quantity}x ${item.name}`)
                            .join(", ")}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {currencySymbol}{Number(order.total_amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getWaitTime(order)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant} className="gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
