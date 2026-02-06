import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, ChefHat, CheckCircle2, Timer, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OrderWithItems } from "@/hooks/useOrders";

interface WaitingTimerProps {
  order: OrderWithItems;
  estimatedMinutes?: number;
  currencySymbol?: string;
  onViewDetails?: () => void;
}

export function WaitingTimer({
  order,
  estimatedMinutes = 15,
  currencySymbol = "₹",
  onViewDetails,
}: WaitingTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Calculate elapsed time from order creation
  useEffect(() => {
    const createdAt = new Date(order.created_at || Date.now()).getTime();
    
    const calculateElapsed = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - createdAt) / 1000);
      setElapsedSeconds(Math.max(0, elapsed));
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    
    return () => clearInterval(interval);
  }, [order.created_at]);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate progress percentage (capped at 100%)
  const progress = useMemo(() => {
    const estimatedSeconds = estimatedMinutes * 60;
    return Math.min(100, (elapsedSeconds / estimatedSeconds) * 100);
  }, [elapsedSeconds, estimatedMinutes]);

  // Status-based styling
  const getStatusInfo = () => {
    switch (order.status) {
      case "pending":
        return {
          icon: Clock,
          text: "Order Received",
          color: "text-warning",
          bgColor: "bg-warning/20",
          description: "Your order is being confirmed",
        };
      case "confirmed":
        return {
          icon: CheckCircle2,
          text: "Order Confirmed",
          color: "text-info",
          bgColor: "bg-info/20",
          description: "Kitchen is preparing your order",
        };
      case "preparing":
        return {
          icon: ChefHat,
          text: "Being Prepared",
          color: "text-primary",
          bgColor: "bg-primary/20",
          description: "Chef is cooking your food",
        };
      case "ready":
        return {
          icon: CheckCircle2,
          text: "Ready!",
          color: "text-success",
          bgColor: "bg-success/20",
          description: "Your order is ready for pickup",
        };
      case "served":
        return {
          icon: CheckCircle2,
          text: "Served",
          color: "text-success",
          bgColor: "bg-success/20",
          description: "Enjoy your meal!",
        };
      default:
        return {
          icon: Clock,
          text: "Processing",
          color: "text-muted-foreground",
          bgColor: "bg-muted",
          description: "Order is being processed",
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const isPreparing = order.status === "preparing" || order.status === "confirmed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardContent className="p-0">
          {/* Status Header */}
          <div className={`${statusInfo.bgColor} px-4 py-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                <span className={`font-semibold ${statusInfo.color}`}>
                  {statusInfo.text}
                </span>
              </div>
              <Badge variant="outline" className="border-current">
                #{order.order_number}
              </Badge>
            </div>
          </div>

          {/* Timer Section */}
          <div className="p-6">
            <div className="flex flex-col items-center">
              {/* Circular Timer */}
              <div className="relative w-32 h-32 mb-4">
                {/* Background circle */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="8"
                  />
                  {/* Progress circle */}
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${progress * 2.83} 283`}
                    initial={{ strokeDasharray: "0 283" }}
                    animate={{ strokeDasharray: `${progress * 2.83} 283` }}
                    transition={{ duration: 0.5 }}
                  />
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {isPreparing && (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Timer className="w-5 h-5 text-primary mb-1" />
                    </motion.div>
                  )}
                  <span className="text-2xl font-bold font-mono">
                    {formatTime(elapsedSeconds)}
                  </span>
                  <span className="text-xs text-muted-foreground">elapsed</span>
                </div>
              </div>

              {/* Estimated Time */}
              <p className="text-sm text-muted-foreground mb-1">
                {statusInfo.description}
              </p>
              <p className="text-sm font-medium">
                Estimated wait:{" "}
                <span className="text-primary">
                  {estimatedMinutes - Math.floor(elapsedSeconds / 60) > 0
                    ? `${Math.max(1, estimatedMinutes - Math.floor(elapsedSeconds / 60))}-${estimatedMinutes} mins`
                    : "Almost ready!"}
                </span>
              </p>
            </div>

            {/* Order Items Preview */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  {order.order_items?.length || 0} items
                </span>
                <span className="font-semibold">
                  {currencySymbol}
                  {Number(order.total_amount || 0).toFixed(2)}
                </span>
              </div>
              
              {onViewDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={onViewDetails}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Order Details
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
