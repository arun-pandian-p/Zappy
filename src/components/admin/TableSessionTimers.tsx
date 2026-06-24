import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Users, AlertTriangle, CheckCircle2, ChefHat, Receipt, Timer, User, ShieldAlert, PhoneCall } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useActiveTableSessions } from "@/hooks/useTableSessions";
import { Button } from "@/components/ui/button";
import { useTables } from "@/hooks/useTables";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { SessionLifecycleService } from "@/services/sessionLifecycleService";

interface TableSessionTimersProps {
  restaurantId: string;
}

// Format seconds to MM:SS or HH:MM:SS
function formatDuration(seconds: number): string {
  if (seconds < 0) return "00:00";
  
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function TableSessionTimers({ restaurantId }: TableSessionTimersProps) {
  const { data: sessions = [], refetch: refetchSessions } = useActiveTableSessions(restaurantId);
  const { data: tables = [] } = useTables(restaurantId);
  const [now, setNow] = useState(Date.now());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Refresh timer every second
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Only show active sessions
  const activeSessions = useMemo(() => {
    return sessions.filter(
      (s) => s.status !== "completed" && s.status !== "cancelled"
    );
  }, [sessions]);

  // Map table IDs to table objects
  const tableMap = useMemo(() => {
    return new Map(tables.map((t) => [t.id, t]));
  }, [tables]);

  // Fetch session details (orders, occupied seats, waiter calls)
  const { data: sessionDetailsMap = {}, refetch: refetchDetails } = useQuery({
    queryKey: ["admin_active_session_details", restaurantId, activeSessions.map(s => s.id)],
    queryFn: async () => {
      if (activeSessions.length === 0) return {};
      
      const sessionIds = activeSessions.map(s => s.id);
      
      // 1. Fetch seat occupancy
      const { data: seatsData } = await supabase
        .from("seat_occupancy")
        .select("*")
        .in("table_session_id", sessionIds)
        .eq("status", "occupied");
        
      // 2. Fetch orders
      const { data: ordersData } = await supabase
        .from("orders")
        .select("id, table_session_id, total_amount, customer_name, created_at, status, special_instructions")
        .in("table_session_id", sessionIds);
        
      // 3. Fetch waiter calls
      const { data: waiterCallsData } = await supabase
        .from("waiter_calls")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .neq("status", "resolved");

      const mapping: Record<string, any> = {};
      activeSessions.forEach(session => {
        const sessionSeats = (seatsData || [])
          .filter(s => s.table_session_id === session.id)
          .map(s => s.seat_number)
          .sort((a, b) => a - b);
          
        const sessionOrders = (ordersData || [])
          .filter(o => o.table_session_id === session.id);
          
        const customerName = sessionOrders.find(o => o.customer_name)?.customer_name || "Guest";
        
        const runningBillAmount = sessionOrders
          .filter(o => o.status !== 'cancelled')
          .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
          
        const lastOrder = sessionOrders.length > 0 
          ? sessionOrders.reduce((latest, o) => {
              const oTime = new Date(o.created_at || '').getTime();
              return oTime > latest ? oTime : latest;
            }, 0)
          : null;
          
        const lastOrderTimeStr = lastOrder 
          ? `${Math.floor((Date.now() - lastOrder) / 60000)}m ago` 
          : "No orders";

        const hasSpecialRequests = sessionOrders.some(o => o.special_instructions && o.special_instructions.trim().length > 0);
        
        const sessionWaiterCalls = (waiterCallsData || [])
          .filter(w => w.table_id === session.table_id);
        const hasCallRequest = sessionWaiterCalls.length > 0;
        const callRequestReason = sessionWaiterCalls.map(w => w.reason).join(", ");

        // Determine Waiter name (Kumar as a default premium touch)
        const waiterName = "Kumar";

        mapping[session.id] = {
          customerName,
          seats: sessionSeats,
          guestCount: sessionSeats.length,
          orderCount: sessionOrders.length,
          runningBillAmount,
          lastOrderTimeStr,
          hasSpecialRequests,
          hasCallRequest,
          callRequestReason,
          waiterName
        };
      });

      return mapping;
    },
    enabled: activeSessions.length > 0,
    refetchInterval: 5000,
  });

  // Calculate durations and stages
  const sessionsWithDurations = useMemo(() => {
    return activeSessions.map((session) => {
      const seatedAt = session.seated_at ? new Date(session.seated_at).getTime() : null;
      const orderPlacedAt = session.order_placed_at ? new Date(session.order_placed_at).getTime() : null;
      const foodReadyAt = session.food_ready_at ? new Date(session.food_ready_at).getTime() : null;
      const servedAt = session.served_at ? new Date(session.served_at).getTime() : null;

      const waitTime = seatedAt ? Math.floor(((orderPlacedAt || now) - seatedAt) / 1000) : 0;
      const prepTime = orderPlacedAt ? Math.floor(((foodReadyAt || now) - orderPlacedAt) / 1000) : 0;
      const serviceTime = foodReadyAt ? Math.floor(((servedAt || now) - foodReadyAt) / 1000) : 0;
      const totalTime = seatedAt ? Math.floor((now - seatedAt) / 1000) : 0;

      const details = sessionDetailsMap[session.id] || {
        customerName: "Guest",
        seats: [],
        guestCount: 0,
        orderCount: 0,
        runningBillAmount: 0,
        lastOrderTimeStr: "No orders",
        hasSpecialRequests: false,
        hasCallRequest: false,
        callRequestReason: "",
        waiterName: "Kumar"
      };

      const table = tableMap.get(session.table_id);
      const tableNumber = table?.table_number || "?";
      const tableCapacity = table?.capacity || 4;

      // Color code wait duration: Green < 15m (900s), Yellow 15-30m (900-1800s), Red > 30m (>1800s)
      let waitColorClass = "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
      if (waitTime >= 1800) {
        waitColorClass = "text-red-600 bg-red-500/10 border-red-500/20";
      } else if (waitTime >= 900) {
        waitColorClass = "text-amber-600 bg-amber-500/10 border-amber-500/20";
      }

      // Stage lookup: Seated → Ordering → Dining → Billing
      let stage = "Seated";
      if (session.status === "billing") {
        stage = "Billing";
      } else if (session.status === "served" || session.status === "dining") {
        stage = "Dining";
      } else if (session.status === "ordering" || session.status === "preparing") {
        stage = "Ordering";
      }

      return {
        ...session,
        tableNumber,
        tableCapacity,
        waitTime,
        prepTime,
        serviceTime,
        totalTime,
        stage,
        waitColorClass,
        ...details
      };
    });
  }, [activeSessions, tableMap, now, sessionDetailsMap]);

  // Kill Session handler (admin force closes)
  const handleKillSession = async (session: any) => {
    try {
      await SessionLifecycleService.terminateSession({
        sessionId: session.id,
        tableId: session.table_id,
        restaurantId,
        initiatedBy: "admin",
      });

      // Invalidate queries to refresh Admin UI instantly
      queryClient.invalidateQueries({ queryKey: ["table_sessions"] });
      queryClient.invalidateQueries({ queryKey: ["admin_active_session_details"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["seat-occupancy"] });
      refetchSessions();
      refetchDetails();

      toast({
        title: "Session Terminated",
        description: `Table ${session.tableNumber} session has been force closed.`,
      });
    } catch (err) {
      console.error("Failed to terminate session:", err);
      toast({
        title: "Error",
        description: "Failed to force close session.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "waiting":
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case "seated":
        return <Users className="w-4 h-4 text-sky-500" />;
      case "ordering":
        return <Receipt className="w-4 h-4 text-amber-500 animate-pulse" />;
      case "preparing":
        return <ChefHat className="w-4 h-4 text-primary" />;
      case "served":
      case "dining":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "billing":
        return <Receipt className="w-4 h-4 text-purple-500" />;
      default:
        return <Timer className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (activeSessions.length === 0) {
    return (
      <Card className="border border-zinc-150 dark:border-zinc-800 shadow-sm">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/20">
          <CardTitle className="text-sm font-black flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
            <Timer className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Active Table Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-bold text-sm">No Active Sessions</p>
            <p className="text-xs">Dine-in tables are currently vacant.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-zinc-150 dark:border-zinc-800 shadow-sm">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-black flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
            <Timer className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Active Table Sessions
          </CardTitle>
          <Badge className="bg-emerald-500 text-white border-0 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">
            {activeSessions.length} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {sessionsWithDurations.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border border-zinc-150 dark:border-zinc-800/80 p-4 space-y-3.5 bg-white dark:bg-zinc-950/20 relative"
            >
              {/* Header: Table, Status, Timer, and Kill */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-black text-base text-zinc-900 dark:text-zinc-50">
                      Table {session.tableNumber}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-black px-2 py-0 rounded-full bg-zinc-50 dark:bg-zinc-900 capitalize border-zinc-200 dark:border-zinc-800 flex items-center gap-1">
                      {getStatusIcon(session.status)}
                      {session.status || "waiting"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Customer:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{session.customerName}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wide">
                      Total: {formatDuration(session.totalTime)}
                    </span>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="h-8 px-3 rounded-xl text-xs font-bold tracking-wide"
                      onClick={() => handleKillSession(session)}
                    >
                      Kill Session
                    </Button>
                  </div>
                </div>
              </div>

              {/* Subtitle details: Seats, guests, waiter, last order */}
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-semibold border-t pt-3 border-zinc-100 dark:border-zinc-900">
                <div className="text-zinc-500">
                  Seats: <span className="font-bold text-zinc-800 dark:text-zinc-200">{session.seats.join(",") || "None"}</span>
                  <span className="text-zinc-350 dark:text-zinc-700 mx-2">|</span>
                  Guests: <span className="font-bold text-zinc-800 dark:text-zinc-200">{session.guestCount} / {session.tableCapacity}</span>
                </div>
                <div className="text-zinc-500 text-right">
                  Stage: <span className="font-bold text-emerald-600 dark:text-emerald-400">{session.stage}</span>
                </div>
                <div className="text-zinc-500">
                  Orders: <span className="font-bold text-zinc-800 dark:text-zinc-200">{session.orderCount}</span>
                  <span className="text-zinc-350 dark:text-zinc-700 mx-2">|</span>
                  <span className="font-extrabold text-zinc-950 dark:text-zinc-50">₹{session.runningBillAmount.toFixed(2)}</span>
                </div>
                <div className="text-zinc-500 text-right">
                  Waiter: <span className="font-bold text-zinc-800 dark:text-zinc-200">{session.waiterName}</span>
                </div>
                <div className="text-[10px] text-zinc-400 font-medium col-span-2 mt-1">
                  Last Order: <span className="font-bold text-zinc-500 dark:text-zinc-300">{session.lastOrderTimeStr}</span>
                </div>
              </div>

              {/* Color-coded Waiter Timer bar */}
              <div className="grid grid-cols-3 gap-2 border-t pt-3 border-zinc-100 dark:border-zinc-900">
                <div className={`rounded-xl p-2 text-center border ${session.waitColorClass}`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Wait</div>
                  <div className="font-mono font-black text-sm">{formatDuration(session.waitTime)}</div>
                </div>
                <div className="rounded-xl p-2 text-center border border-zinc-100 dark:border-zinc-900/60 bg-zinc-50/30 dark:bg-zinc-900/10 text-zinc-600 dark:text-zinc-300">
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Prep</div>
                  <div className="font-mono font-black text-sm">{formatDuration(session.prepTime)}</div>
                </div>
                <div className="rounded-xl p-2 text-center border border-zinc-100 dark:border-zinc-900/60 bg-zinc-50/30 dark:bg-zinc-900/10 text-zinc-600 dark:text-zinc-300">
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Service</div>
                  <div className="font-mono font-black text-sm">{formatDuration(session.serviceTime)}</div>
                </div>
              </div>

              {/* Special Badges (Special requests or Waiter Call requests) */}
              {(session.hasSpecialRequests || session.hasCallRequest) && (
                <div className="flex flex-wrap gap-2.5 pt-1.5">
                  {session.hasCallRequest && (
                    <Badge className="bg-rose-500 text-white border-0 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                      <PhoneCall className="w-3 h-3" />
                      Call Request: {session.callRequestReason || "Assistance"}
                    </Badge>
                  )}
                  {session.hasSpecialRequests && (
                    <Badge className="bg-amber-500 text-white border-0 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      Special Requests
                    </Badge>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
