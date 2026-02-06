import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Users, AlertTriangle, CheckCircle2, ChefHat, Receipt, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTableSessions } from "@/hooks/useTableSessions";
import { useTables } from "@/hooks/useTables";

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

// Get color class based on duration thresholds
function getDurationColor(seconds: number, type: "wait" | "prep" | "service"): string {
  const thresholds = {
    wait: { warning: 300, danger: 600 },    // 5min, 10min
    prep: { warning: 900, danger: 1500 },   // 15min, 25min
    service: { warning: 180, danger: 300 }, // 3min, 5min
  };
  
  const t = thresholds[type];
  if (seconds >= t.danger) return "text-destructive";
  if (seconds >= t.warning) return "text-warning";
  return "text-success";
}

function getDurationBgColor(seconds: number, type: "wait" | "prep" | "service"): string {
  const thresholds = {
    wait: { warning: 300, danger: 600 },
    prep: { warning: 900, danger: 1500 },
    service: { warning: 180, danger: 300 },
  };
  
  const t = thresholds[type];
  if (seconds >= t.danger) return "bg-destructive/10";
  if (seconds >= t.warning) return "bg-warning/10";
  return "bg-success/10";
}

export function TableSessionTimers({ restaurantId }: TableSessionTimersProps) {
  const { data: sessions = [] } = useTableSessions(restaurantId);
  const { data: tables = [] } = useTables(restaurantId);
  const [now, setNow] = useState(Date.now());

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

  // Map table IDs to table numbers
  const tableMap = useMemo(() => {
    return new Map(tables.map((t) => [t.id, t.table_number]));
  }, [tables]);

  // Calculate durations for each session
  const sessionsWithDurations = useMemo(() => {
    return activeSessions.map((session) => {
      const seatedAt = session.seated_at ? new Date(session.seated_at).getTime() : null;
      const orderPlacedAt = session.order_placed_at ? new Date(session.order_placed_at).getTime() : null;
      const foodReadyAt = session.food_ready_at ? new Date(session.food_ready_at).getTime() : null;
      const servedAt = session.served_at ? new Date(session.served_at).getTime() : null;
      const billingAt = session.billing_at ? new Date(session.billing_at).getTime() : null;

      // Wait time: seated → order placed (or now if not ordered)
      const waitTime = seatedAt
        ? Math.floor(((orderPlacedAt || now) - seatedAt) / 1000)
        : 0;

      // Prep time: order placed → food ready (or now if not ready)
      const prepTime = orderPlacedAt
        ? Math.floor(((foodReadyAt || now) - orderPlacedAt) / 1000)
        : 0;

      // Service time: food ready → served (or now if not served)
      const serviceTime = foodReadyAt
        ? Math.floor(((servedAt || now) - foodReadyAt) / 1000)
        : 0;

      // Total active time
      const totalTime = seatedAt ? Math.floor((now - seatedAt) / 1000) : 0;

      return {
        ...session,
        tableNumber: tableMap.get(session.table_id) || "?",
        waitTime,
        prepTime,
        serviceTime,
        totalTime,
      };
    });
  }, [activeSessions, tableMap, now]);

  // Get status icon
  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "waiting":
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case "seated":
        return <Users className="w-4 h-4 text-info" />;
      case "ordering":
        return <Receipt className="w-4 h-4 text-warning" />;
      case "preparing":
        return <ChefHat className="w-4 h-4 text-primary" />;
      case "served":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "billing":
        return <Receipt className="w-4 h-4 text-purple-500" />;
      default:
        return <Timer className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (activeSessions.length === 0) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            Active Table Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No active sessions</p>
            <p className="text-sm">Sessions will appear when customers are seated</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            Active Table Sessions
          </CardTitle>
          <Badge variant="secondary">{activeSessions.length} active</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessionsWithDurations.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-lg border p-3"
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(session.status)}
                  <span className="font-semibold">Table {session.tableNumber}</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {session.status || "waiting"}
                  </Badge>
                </div>
                <div className="text-sm font-mono text-muted-foreground">
                  Total: {formatDuration(session.totalTime)}
                </div>
              </div>

              {/* Timer grid */}
              <div className="grid grid-cols-3 gap-2">
                {/* Wait Time */}
                <div
                  className={`rounded-md p-2 text-center ${getDurationBgColor(
                    session.waitTime,
                    "wait"
                  )}`}
                >
                  <div className="text-xs text-muted-foreground mb-1">Wait</div>
                  <div
                    className={`font-mono font-semibold ${getDurationColor(
                      session.waitTime,
                      "wait"
                    )}`}
                  >
                    {formatDuration(session.waitTime)}
                  </div>
                </div>

                {/* Prep Time */}
                <div
                  className={`rounded-md p-2 text-center ${getDurationBgColor(
                    session.prepTime,
                    "prep"
                  )}`}
                >
                  <div className="text-xs text-muted-foreground mb-1">Prep</div>
                  <div
                    className={`font-mono font-semibold ${getDurationColor(
                      session.prepTime,
                      "prep"
                    )}`}
                  >
                    {formatDuration(session.prepTime)}
                  </div>
                </div>

                {/* Service Time */}
                <div
                  className={`rounded-md p-2 text-center ${getDurationBgColor(
                    session.serviceTime,
                    "service"
                  )}`}
                >
                  <div className="text-xs text-muted-foreground mb-1">Service</div>
                  <div
                    className={`font-mono font-semibold ${getDurationColor(
                      session.serviceTime,
                      "service"
                    )}`}
                  >
                    {formatDuration(session.serviceTime)}
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {(session.waitTime > 600 || session.prepTime > 1500) && (
                <div className="flex items-center gap-2 mt-2 text-xs text-destructive">
                  <AlertTriangle className="w-3 h-3" />
                  <span>
                    {session.waitTime > 600 && "Long wait time!"}
                    {session.waitTime > 600 && session.prepTime > 1500 && " • "}
                    {session.prepTime > 1500 && "Prep taking too long!"}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
