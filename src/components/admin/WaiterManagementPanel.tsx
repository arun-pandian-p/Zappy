import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { useTables } from "@/hooks/useTables";
import { Label } from "@/components/ui/label";
import { 
  Users, UserCheck, Play, Power, Star, Receipt, 
  MapPin, Clock, ArrowRightLeft, ShieldAlert, Loader2, RefreshCw 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WaiterManagementPanelProps {
  restaurantId: string;
}

export function WaiterManagementPanel({ restaurantId }: WaiterManagementPanelProps) {
  const { data: tables = [] } = useTables(restaurantId);
  const [waiters, setWaiters] = useState<any[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedWaiter, setSelectedWaiter] = useState<any | null>(null);
  const [selectedTable, setSelectedTable] = useState("");
  const [transferTargetWaiter, setTransferTargetWaiter] = useState("");
  const [selectedAssignmentForTransfer, setSelectedAssignmentForTransfer] = useState<any | null>(null);

  // Tables loading state for Assign modal
  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  useEffect(() => {
    loadWaitersData();
  }, [restaurantId]);

  async function loadWaitersData() {
    if (!restaurantId) return;
    setLoading(true);
    try {
      // Load Waiters
      const { data: empData, error: empErr } = await supabase
        .from("employees")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("role", "WAITER");
      
      if (empErr) throw empErr;

      // Load Assignments
      const { data: assignData, error: assignErr } = await supabase
        .from("employee_assignments")
        .select("*, tables(table_number)")
        .eq("restaurant_id", restaurantId)
        .is("unassigned_at", null);

      if (assignErr) throw assignErr;

      // Load active orders
      const { data: ordersData, error: ordersErr } = await supabase
        .from("orders")
        .select("id, table_id, total_amount, status, order_number")
        .eq("restaurant_id", restaurantId)
        .neq("status", "completed")
        .neq("status", "cancelled");

      if (ordersErr) throw ordersErr;

      // Load latest shifts
      const { data: shiftData, error: shiftErr } = await supabase
        .from("employee_shifts")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("scheduled_start", { ascending: false });

      if (shiftErr) throw shiftErr;

      setWaiters(empData || []);
      setActiveAssignments(assignData || []);
      setOrders(ordersData || []);
      setShifts(shiftData || []);
    } catch (e: any) {
      toast({ title: "Load Error", description: e.message || "Failed to load waiters", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // Toggle Clock In / Out
  const handleToggleClock = async (waiter: any) => {
    const isClockedIn = waiter.status === "ACTIVE";
    const nextStatus = isClockedIn ? "OFF_DUTY" : "ACTIVE";
    
    try {
      // 1. Update employee status
      const { error: empErr } = await supabase
        .from("employees")
        .update({ status: nextStatus })
        .eq("id", waiter.id);

      if (empErr) throw empErr;

      // 2. Log in attendance
      if (!isClockedIn) {
        // Clock In
        await supabase
          .from("employee_attendance")
          .insert({
            restaurant_id: restaurantId,
            employee_id: waiter.id,
            login_time: new Date().toISOString()
          });
        toast({ title: "Clocked In", description: `${waiter.full_name} is now on duty.` });
      } else {
        // Clock Out - Find latest active session
        const { data: activeSessions } = await supabase
          .from("employee_attendance")
          .select("*")
          .eq("employee_id", waiter.id)
          .is("logout_time", null)
          .order("login_time", { ascending: false })
          .limit(1);

        if (activeSessions && activeSessions.length > 0) {
          const session = activeSessions[0];
          const login = new Date(session.login_time).getTime();
          const logout = Date.now();
          const workedMinutes = Math.floor((logout - login) / 60000);

          await supabase
            .from("employee_attendance")
            .update({
              logout_time: new Date().toISOString(),
              total_worked_minutes: workedMinutes,
              overtime_minutes: workedMinutes > 480 ? workedMinutes - 480 : 0
            })
            .eq("id", session.id);
        }
        toast({ title: "Clocked Out", description: `${waiter.full_name} is off duty.` });
      }

      loadWaitersData();
    } catch (e: any) {
      toast({ title: "Status Update Failed", description: e.message, variant: "destructive" });
    }
  };

  const loadAvailableTables = async () => {
    setLoadingTables(true);
    try {
      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("table_number");

      if (error) throw error;
      
      const assignedTableIds = new Set(activeAssignments.map(a => a.table_id));
      const unassigned = (data || []).filter(t => !assignedTableIds.has(t.id));
      setAvailableTables(unassigned);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Failed to load tables", description: err.message, variant: "destructive" });
    } finally {
      setLoadingTables(false);
    }
  };

  // Assign Table Submit
  const handleAssignTable = async () => {
    if (!selectedWaiter || !selectedTable) return;
    try {
      // Check if table already assigned
      const isAssigned = activeAssignments.some(as => as.table_id === selectedTable);
      if (isAssigned) {
        toast({ title: "Table Occupied", description: "This table is already assigned to a waiter.", variant: "destructive" });
        return;
      }

      const { error } = await supabase
        .from("employee_assignments")
        .insert({
          restaurant_id: restaurantId,
          employee_id: selectedWaiter.id,
          table_id: selectedTable,
          assigned_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({ title: "Success", description: "Table assigned successfully." });
      setTableModalOpen(false);
      setSelectedTable("");
      loadWaitersData();
    } catch (e: any) {
      toast({ title: "Assignment Failed", description: e.message, variant: "destructive" });
    }
  };

  // Transfer Table Submit
  const handleTransferTable = async () => {
    if (!selectedAssignmentForTransfer || !transferTargetWaiter) return;
    try {
      // 1. Unassign current waiter
      await supabase
        .from("employee_assignments")
        .update({ unassigned_at: new Date().toISOString() })
        .eq("id", selectedAssignmentForTransfer.id);

      // 2. Assign target waiter
      const { error } = await supabase
        .from("employee_assignments")
        .insert({
          restaurant_id: restaurantId,
          employee_id: transferTargetWaiter,
          table_id: selectedAssignmentForTransfer.table_id,
          assigned_at: new Date().toISOString()
        });

      if (error) throw error;

      const targetName = waiters.find(w => w.id === transferTargetWaiter)?.full_name || "New Waiter";
      toast({ title: "Transfer Successful", description: `Table transferred to ${targetName}.` });
      setTransferModalOpen(false);
      setTransferTargetWaiter("");
      setSelectedAssignmentForTransfer(null);
      loadWaitersData();
    } catch (e: any) {
      toast({ title: "Transfer Failed", description: e.message, variant: "destructive" });
    }
  };

  // Get tables assigned to a waiter
  const getWaiterTables = (waiterId: string) => {
    return activeAssignments
      .filter(as => as.employee_id === waiterId)
      .map(as => as.tables?.table_number || "");
  };

  // Get active orders for a waiter
  const getWaiterActiveOrders = (waiterId: string) => {
    const tableIds = activeAssignments
      .filter(as => as.employee_id === waiterId)
      .map(as => as.table_id);
    
    return orders.filter(o => tableIds.includes(o.table_id));
  };

  // Serve order action
  const handleServeOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "served" })
        .eq("id", orderId);
        
      if (error) throw error;
      toast({ title: "Order Served", description: "Order marked as served." });
      loadWaitersData();
    } catch (e: any) {
      toast({ title: "Failed to update order", description: e.message, variant: "destructive" });
    }
  };

  // Get waiter's active shift from employee_shifts
  const getWaiterShift = (waiterId: string) => {
    const waiterShift = shifts.find(s => s.employee_id === waiterId);
    return waiterShift ? waiterShift.shift_name : "No Shift";
  };

  // Generate mock performance metrics for presentation
  const getPerformanceMetrics = (waiterId: string) => {
    // Generate deterministic mock stats based on waiter id hash
    const seed = waiterId.charCodeAt(0) + waiterId.charCodeAt(2) || 10;
    const rating = (4.0 + (seed % 10) / 10).toFixed(1);
    const ordersCount = 15 + (seed % 20);
    const upsell = 800 + (seed % 15) * 100;
    const shift = getWaiterShift(waiterId);
    return { rating, orders: ordersCount, upsell, shift };
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex justify-between items-center bg-card p-6 border rounded-3xl shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Waiter Management</h2>
          <p className="text-sm text-muted-foreground">Monitor service performance, clock-in, and table floor coverage.</p>
        </div>
        <Button onClick={loadWaitersData} variant="outline" className="rounded-xl gap-1.5">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : waiters.length === 0 ? (
        <Card className="border border-dashed rounded-3xl p-12 text-center text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-base font-medium">No Waiters Registered</p>
          <p className="text-sm">Please register waiter staff in the Staff/Directory section.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {waiters.map(waiter => {
            const assigned = getWaiterTables(waiter.id);
            const stats = getPerformanceMetrics(waiter.id);
            const isClockedIn = waiter.status === "ACTIVE";

            return (
              <Card key={waiter.id} className="rounded-3xl border shadow-sm bg-white dark:bg-zinc-950 overflow-hidden">
                {/* Waiter Card Header */}
                <div className="p-5 flex justify-between items-start border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border border-slate-200">
                      <AvatarImage src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${waiter.username}`} />
                      <AvatarFallback className="bg-primary/10 text-primary">{waiter.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{waiter.full_name}</h3>
                      <span className="text-xs text-muted-foreground">ID: W-{waiter.username.toUpperCase()}</span>
                      {waiter.phone && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">📱 {waiter.phone}</div>
                      )}
                    </div>
                  </div>
                  <Badge className={`border-0 rounded-full text-[10px] font-bold ${
                    isClockedIn ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-slate-100 text-slate-500"
                  }`}>
                    {isClockedIn ? "ON DUTY" : "OFF DUTY"}
                  </Badge>
                </div>

                {/* Waiter Stats Block */}
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border">
                      <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5"><Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Rating</div>
                      <div className="text-sm font-black text-slate-900 dark:text-white mt-1">{stats.rating}</div>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border">
                      <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5"><Receipt className="w-3 h-3 text-blue-500" /> Orders</div>
                      <div className="text-sm font-black text-slate-900 dark:text-white mt-1">{stats.orders}</div>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border">
                      <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5"><Clock className="w-3 h-3 text-purple-500" /> Shift</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{stats.shift}</div>
                    </div>
                  </div>

                  {/* Assigned Tables */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Assigned Tables
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {assigned.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">No tables assigned</span>
                      ) : (
                        assigned.map(num => {
                          const assignment = activeAssignments.find(as => as.employee_id === waiter.id && as.tables?.table_number === num);
                          return (
                            <Badge 
                              key={num} 
                              variant="secondary" 
                              className="text-xs px-2.5 py-0.5 bg-slate-100 hover:bg-slate-200 border rounded-lg flex items-center gap-1"
                              onClick={() => {
                                setSelectedAssignmentForTransfer(assignment);
                                setTransferModalOpen(true);
                              }}
                              title="Click to Transfer Table"
                            >
                              Table {num}
                              <ArrowRightLeft className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Active Orders List */}
                  <div className="space-y-1.5 border-t pt-3">
                    <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-blue-500" /> Active Orders ({getWaiterActiveOrders(waiter.id).length})
                    </span>
                    <div className="space-y-1 pt-1">
                      {getWaiterActiveOrders(waiter.id).length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">No active orders</span>
                      ) : (
                        getWaiterActiveOrders(waiter.id).map(order => {
                          const tableNum = tables.find(t => t.id === order.table_id)?.table_number || "T";
                          return (
                            <div key={order.id} className="flex justify-between items-center bg-slate-50 dark:bg-zinc-900/50 p-2 border rounded-xl text-[11px]">
                              <div>
                                <span className="font-bold text-slate-800 dark:text-zinc-200">#{order.order_number || order.id.substring(0,4)}</span>
                                <span className="text-muted-foreground ml-1">(Table {tableNum})</span>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  ₹{Number(order.total_amount).toFixed(0)} · <span className="uppercase text-blue-500 font-medium">{order.status}</span>
                                </div>
                              </div>
                              {order.status === "ready" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleServeOrder(order.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-6 px-2 text-[10px] font-bold"
                                >
                                  Serve
                                </Button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4 flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleToggleClock(waiter)} 
                      className={`flex-1 rounded-xl h-9 font-bold text-xs gap-1.5`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      {isClockedIn ? "Clock Out" : "Clock In"}
                    </Button>
                    <Button 
                      size="sm" 
                      disabled={!isClockedIn} 
                      onClick={() => {
                        setSelectedWaiter(waiter);
                        setTableModalOpen(true);
                        loadAvailableTables();
                      }} 
                      className="flex-1 rounded-xl h-9 font-bold text-xs gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Assign Table
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assign Table Dialog */}
      <Dialog open={tableModalOpen} onOpenChange={setTableModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl" aria-describedby="waiter-assign-desc">
          <DialogHeader>
            <DialogTitle>Assign Table</DialogTitle>
            <DialogDescription id="waiter-assign-desc">
              Assign a new dining table to {selectedWaiter?.full_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Select Table Number</Label>
              <Select value={selectedTable} onValueChange={setSelectedTable} disabled={loadingTables}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={loadingTables ? "Loading tables..." : "Select a table..."} />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.length === 0 && !loadingTables ? (
                    <SelectItem value="empty" disabled>No active tables found</SelectItem>
                  ) : (
                    availableTables.map(table => (
                      <SelectItem key={table.id} value={table.id}>Table {table.table_number} ({table.capacity} seats)</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAssignTable} className="w-full rounded-2xl h-11 font-bold mt-2">
              Confirm Assignment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Table Dialog */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl" aria-describedby="transfer-desc">
          <DialogHeader>
            <DialogTitle>Transfer Table Assignment</DialogTitle>
            <DialogDescription id="transfer-desc">
              Transfer Table {selectedAssignmentForTransfer?.tables?.table_number} assignment to another waiter.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Select Transfer Target Waiter</Label>
              <Select value={transferTargetWaiter} onValueChange={setTransferTargetWaiter}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select target waiter..." />
                </SelectTrigger>
                <SelectContent>
                  {waiters
                    .filter(w => w.id !== selectedAssignmentForTransfer?.employee_id && w.status === "ACTIVE")
                    .map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.full_name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleTransferTable} className="w-full rounded-2xl h-11 font-bold mt-2">
              Transfer Assignment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
