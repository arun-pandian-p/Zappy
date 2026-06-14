import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Users, AlertTriangle, Timer, XCircle, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTableSessions, useUpdateTableSession } from "@/hooks/useTableSessions";
import { useTables } from "@/hooks/useTables";
import { Button } from "@/components/ui/button";

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
// Green: <15 min (900s), Yellow: 15-30 min (1800s), Red: >30 min (1800s)
function getDurationColor(seconds: number): string {
  if (seconds >= 1800) return "text-red-600 dark:text-red-400 font-bold";
  if (seconds >= 900) return "text-amber-600 dark:text-amber-400 font-bold";
  return "text-emerald-600 dark:text-emerald-400 font-bold";
}

function getDurationBgColor(seconds: number): string {
  if (seconds >= 1800) return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900";
  if (seconds >= 900) return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900";
  return "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900";
}

export function TableSessionTimers({ restaurantId }: TableSessionTimersProps) {
  const { data: sessions = [] } = useTableSessions(restaurantId);
  const { data: tables = [] } = useTables(restaurantId);
  const updateSession = useUpdateTableSession();
  const [now, setNow] = useState(Date.now());

  // Refresh timer every second
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Map table IDs to table numbers and capacities
  const tableMap = useMemo(() => {
    return new Map(tables.map((t) => [t.id, { number: t.table_number, capacity: t.capacity }]));
  }, [tables]);

  // Only show active sessions based on user request: seated, ordering, preparing, dining
  const activeSessions = useMemo(() => {
    const activeStatuses = ["seated", "ordering", "preparing", "dining", "served", "billing"];
    return sessions.filter((s) => activeStatuses.includes(s.status || ""));
  }, [sessions]);

  // Calculate durations for each session
  const sessionsWithDurations = useMemo(() => {
    return activeSessions.map((session) => {
      // Timer source: seated_at is the session_started_at
      const startedAt = session.seated_at ? new Date(session.seated_at).getTime() : null;
      const orderPlacedAt = session.order_placed_at ? new Date(session.order_placed_at).getTime() : null;
      const foodReadyAt = session.food_ready_at ? new Date(session.food_ready_at).getTime() : null;
      const servedAt = session.served_at ? new Date(session.served_at).getTime() : null;

      // Wait time: seated → order placed
      const waitTime = startedAt
        ? Math.floor(((orderPlacedAt || now) - startedAt) / 1000)
        : 0;

      // Prep time: order placed → food ready
      const prepTime = orderPlacedAt
        ? Math.floor(((foodReadyAt || now) - orderPlacedAt) / 1000)
        : 0;

      // Service time: food ready → served
      const serviceTime = foodReadyAt
        ? Math.floor(((servedAt || now) - foodReadyAt) / 1000)
        : 0;

      // Total active time
      const totalTime = startedAt ? Math.floor((now - startedAt) / 1000) : 0;

      const tableData = tableMap.get(session.table_id);

      return {
        ...session,
        tableNumber: tableData?.number || "?",
        guests: tableData?.capacity || 4,
        waitTime,
        prepTime,
        serviceTime,
        totalTime,
      };
    });
  }, [activeSessions, tableMap, now]);

  const handleEndSession = async (sessionId: string) => {
    await updateSession.mutateAsync({
      id: sessionId,
      updates: { 
        status: "completed", 
        completed_at: new Date().toISOString() 
      }
    });
  };

  const handleResetSession = async (sessionId: string) => {
    const currentTime = new Date().toISOString();
    await updateSession.mutateAsync({
      id: sessionId,
      updates: { 
        seated_at: currentTime,
        order_placed_at: null,
        food_ready_at: null,
        served_at: null,
        billing_at: null,
        status: "seated"
      }
    });
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
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-40 text-primary" />
            <p className="font-semibold text-lg text-foreground">No Active Tables</p>
            <p className="text-sm">Sessions start when customers scan QR or are assigned.</p>
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
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{activeSessions.length} active</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sessionsWithDurations.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-xl border shadow-sm flex flex-col overflow-hidden ${getDurationBgColor(session.totalTime)}`}
            >
              {/* Header */}
              <div className="bg-white/50 dark:bg-black/20 p-3 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg leading-none">Table {session.tableNumber}</h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Guests: {session.guests}</span>
                    <span>•</span>
                    <span className="capitalize text-primary">Status: {session.status === 'served' ? 'dining' : session.status}</span>
                  </div>
                </div>
                {session.totalTime >= 1800 && (
                  <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                )}
              </div>

              {/* Timers */}
              <div className="p-3 space-y-2 flex-1">
                <div className="flex justify-between items-center text-sm border-b border-black/5 pb-1.5">
                  <span className="text-muted-foreground font-medium">Wait:</span>
                  <span className={`font-mono ${getDurationColor(session.waitTime)}`}>{formatDuration(session.waitTime)}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-black/5 pb-1.5">
                  <span className="text-muted-foreground font-medium">Prep:</span>
                  <span className={`font-mono ${getDurationColor(session.prepTime)}`}>{formatDuration(session.prepTime)}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-black/5 pb-1.5">
                  <span className="text-muted-foreground font-medium">Service:</span>
                  <span className={`font-mono ${getDurationColor(session.serviceTime)}`}>{formatDuration(session.serviceTime)}</span>
                </div>
                <div className="flex justify-between items-center text-base pt-1">
                  <span className="font-bold">Total:</span>
                  <span className={`font-mono text-lg tracking-tight ${getDurationColor(session.totalTime)}`}>{formatDuration(session.totalTime)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-2 bg-white/50 dark:bg-black/20 border-t flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  onClick={() => handleResetSession(session.id)}
                >
                  <RotateCcw className="w-3 h-3 mr-1" /> Reset
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 h-8 text-xs bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/50 text-red-600 border-red-200 dark:border-red-900"
                  onClick={() => handleEndSession(session.id)}
                >
                  <XCircle className="w-3 h-3 mr-1" /> End
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
