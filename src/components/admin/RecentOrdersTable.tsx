import { motion } from "framer-motion";
import { ArrowRight, SquareMenu } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface OrderItem {
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  tableNumber: string;
  items: OrderItem[];
  status: "pending" | "preparing" | "ready" | "delivered" | "completed";
  amount: number;
}

interface RecentOrdersTableProps {
  orders: Order[];
  currencySymbol?: string;
  onViewAll?: () => void;
}

const statusStyles = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  preparing: "bg-blue-100 text-blue-700 border-blue-200",
  ready: "bg-emerald-100 text-emerald-700 border-emerald-200",
  delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  completed: "bg-muted text-muted-foreground border-muted",
};

const statusLabels = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  delivered: "Delivered",
  completed: "Completed",
};

export function RecentOrdersTable({
  orders,
  currencySymbol = "₹",
  onViewAll,
}: RecentOrdersTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">Table No.</TableHead>
                <TableHead className="text-muted-foreground font-medium">Items</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.slice(0, 5).map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="hover:bg-muted/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <SquareMenu className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{order.tableNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ArrowRight className="w-3 h-3" />
                      <span>
                        {order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("font-medium border", statusStyles[order.status])}
                    >
                      {statusLabels[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {currencySymbol}{order.amount}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>

          {onViewAll && (
            <div className="mt-4 pt-4 border-t">
              <Button variant="link" onClick={onViewAll} className="p-0 h-auto text-primary">
                View All Orders <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
