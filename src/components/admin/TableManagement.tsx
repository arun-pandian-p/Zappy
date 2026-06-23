import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTables, useCreateTable, useUpdateTable, useDeleteTable, useAllSeatOccupancy } from "@/hooks/useTables";
import { useOrders } from "@/hooks/useOrders";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/services/auditLogger";
import { checkTableDependencies } from "@/utils/tableDependencies";
import { TableDeleteConfirmDialog } from "@/components/admin/TableDeleteConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  Grid3X3, Plus, Trash2, Combine, Split, UserPlus, 
  Clock, Coffee, Info, Loader2, AlertCircle, RefreshCw,
  LayoutGrid, Users, DollarSign
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TableManagementProps {
  restaurantId: string;
}

export function TableManagement({ restaurantId }: TableManagementProps) {
  const { data: tables = [], isLoading: tablesLoading, refetch: refetchTables } = useTables(restaurantId);
  const { data: orders = [], isLoading: ordersLoading } = useOrders(restaurantId);
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();
  const { data: allSeatOccupancy = [] } = useAllSeatOccupancy(restaurantId);

  const [newTableNumber, setNewTableNumber] = useState("");
  const [newCapacity, setNewCapacity] = useState("4");
  const [newSection, setNewSection] = useState("Main Hall");

  // Local state for layout details
  const [sectionsMap, setSectionsMap] = useState<Record<string, string>>({}); // tableId -> Section
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [mergedTables, setMergedTables] = useState<Array<{ id: string; tableIds: string[]; name: string }>>([]);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<any | null>(null);
  const [dependencyCounts, setDependencyCounts] = useState<any | null>(null);
  const [deletingTableInProgress, setDeletingTableInProgress] = useState(false);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTableForAssign, setSelectedTableForAssign] = useState<any | null>(null);
  const [selectedWaiterForAssign, setSelectedWaiterForAssign] = useState("");

  const [reservationsMap, setReservationsMap] = useState<Record<string, { time: string; name: string }>>({});
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [selectedTableForReserve, setSelectedTableForReserve] = useState<any | null>(null);
  const [reservationTime, setReservationTime] = useState("");
  const [reservationName, setReservationName] = useState("");

  // Load waiters and assignments via useQuery for realtime invalidation
  const { data: waiters = [] } = useQuery({
    queryKey: ["waiters", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data } = await supabase.from("employees").select("*").eq("restaurant_id", restaurantId).eq("role", "WAITER");
      return data || [];
    },
    enabled: !!restaurantId
  });

  const { data: assignmentsData = [], refetch: refetchAssignments } = useQuery({
    queryKey: ["employee_assignments", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data } = await supabase.from("employee_assignments").select("*, employees(full_name)").eq("restaurant_id", restaurantId).is("unassigned_at", null);
      return data || [];
    },
    enabled: !!restaurantId
  });

  const assignments = useMemo(() => {
    const mapping: Record<string, string> = {};
    assignmentsData.forEach((as: any) => {
      if (as.table_id && as.employees?.full_name) {
        mapping[as.table_id] = as.employees.full_name;
      }
    });
    return mapping;
  }, [assignmentsData]);

  // Real-time subscription for employee_assignments
  useEffect(() => {
    if (!restaurantId) return;
    const channel = supabase.channel(`assignments-${restaurantId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "employee_assignments", filter: `restaurant_id=eq.${restaurantId}` }, () => {
        refetchAssignments();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurantId, refetchAssignments]);

  useEffect(() => {

    // Load sections & merges from localStorage
    const savedSections = localStorage.getItem(`zappy_sections_${restaurantId}`);
    if (savedSections) {
      setSectionsMap(JSON.parse(savedSections));
    }
    const savedMerges = localStorage.getItem(`zappy_merges_${restaurantId}`);
    if (savedMerges) {
      setMergedTables(JSON.parse(savedMerges));
    }
    const savedReservations = localStorage.getItem(`zappy_reservations_${restaurantId}`);
    if (savedReservations) {
      setReservationsMap(JSON.parse(savedReservations));
    }
  }, [restaurantId]);

  const saveSections = (newMap: Record<string, string>) => {
    setSectionsMap(newMap);
    localStorage.setItem(`zappy_sections_${restaurantId}`, JSON.stringify(newMap));
  };

  const saveReservations = (newMap: Record<string, { time: string; name: string }>) => {
    setReservationsMap(newMap);
    localStorage.setItem(`zappy_reservations_${restaurantId}`, JSON.stringify(newMap));
  };

  const handleAddTable = async () => {
    if (!newTableNumber.trim()) {
      toast({ title: "Table number required", variant: "destructive" });
      return;
    }
    try {
      const table = await createTable.mutateAsync({
        restaurant_id: restaurantId,
        table_number: newTableNumber.trim(),
        capacity: parseInt(newCapacity) || 4,
        status: "available",
      });

      // Save section
      const updatedSections = { ...sectionsMap, [table.id]: newSection };
      saveSections(updatedSections);

      logActivity({
        restaurantId,
        action: `Created table ${newTableNumber.trim()}`,
        tableName: "tables",
        recordId: table.id,
        newValues: { table_number: newTableNumber.trim(), capacity: parseInt(newCapacity) || 4, section: newSection }
      });

      toast({ title: "Table Created", description: `Table ${newTableNumber} has been added.` });
      setNewTableNumber("");
      setNewCapacity("4");
    } catch (e: any) {
      toast({ title: "Failed to create table", description: e.message, variant: "destructive" });
    }
  };

  const handleStatusChange = async (tableId: string, newStatus: string) => {
    if (newStatus === "reserved") {
      const table = tables.find(t => t.id === tableId);
      setSelectedTableForReserve(table);
      const currentRes = reservationsMap[tableId] || { time: "", name: "" };
      setReservationTime(currentRes.time);
      setReservationName(currentRes.name);
      setReserveModalOpen(true);
      return;
    }

    try {
      await updateTable.mutateAsync({
        id: tableId,
        updates: { status: newStatus }
      });
      if (reservationsMap[tableId]) {
        const updated = { ...reservationsMap };
        delete updated[tableId];
        saveReservations(updated);
      }
      
      const table = tables.find(t => t.id === tableId);
      logActivity({
        restaurantId,
        action: `Changed table ${table?.table_number || tableId} status to ${newStatus}`,
        tableName: "tables",
        recordId: tableId,
        newValues: { status: newStatus }
      });

      toast({ title: "Table Updated", description: `Table status changed to ${newStatus}.` });
    } catch (e: any) {
      toast({ title: "Update Failed", description: e.message, variant: "destructive" });
    }
  };

  const handleReserveSubmit = async () => {
    if (!selectedTableForReserve) return;
    if (!reservationTime.trim()) {
      toast({ title: "Reservation time required", variant: "destructive" });
      return;
    }
    try {
      await updateTable.mutateAsync({
        id: selectedTableForReserve.id,
        updates: { status: "reserved" }
      });
      
      const updated = {
        ...reservationsMap,
        [selectedTableForReserve.id]: {
          time: reservationTime.trim(),
          name: reservationName.trim() || "Guest"
        }
      };
      saveReservations(updated);

      logActivity({
        restaurantId,
        action: `Reserved table ${selectedTableForReserve.table_number}`,
        tableName: "tables",
        recordId: selectedTableForReserve.id,
        newValues: { status: "reserved", time: reservationTime.trim(), name: reservationName.trim() }
      });
      
      toast({
        title: "Table Reserved",
        description: `Table ${selectedTableForReserve.table_number} reserved at ${reservationTime} for ${reservationName || "Guest"}.`
      });
      setReserveModalOpen(false);
    } catch (e: any) {
      toast({ title: "Failed to reserve table", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteTable = async (table: any) => {
    try {
      setTableToDelete(table);
      const counts = await checkTableDependencies(table.id);
      setDependencyCounts(counts);
      setDeleteConfirmOpen(true);
    } catch (e: any) {
      toast({ title: "Error checking dependencies", description: e.message, variant: "destructive" });
    }
  };

  const handleConfirmDeleteTable = async () => {
    if (!tableToDelete) return;
    setDeletingTableInProgress(true);
    try {
      await deleteTable.mutateAsync({ id: tableToDelete.id, restaurantId });

      logActivity({
        restaurantId,
        action: `Archived table ${tableToDelete.table_number}`,
        tableName: "tables",
        recordId: tableToDelete.id,
        oldValues: tableToDelete
      });

      toast({ title: "Table Archived Successfully" });
      setSelectedTableIds(prev => prev.filter(id => id !== tableToDelete.id));
      setDeleteConfirmOpen(false);
      setTableToDelete(null);
    } catch (e: any) {
      toast({ title: "Failed to delete table", description: e.message, variant: "destructive" });
    } finally {
      setDeletingTableInProgress(false);
    }
  };

  const handleSelectTable = (tableId: string) => {
    setSelectedTableIds(prev => 
      prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId]
    );
  };

  // Merge selected tables
  const handleMergeTables = () => {
    if (selectedTableIds.length < 2) {
      toast({ title: "Selection Error", description: "Select at least 2 tables to merge.", variant: "destructive" });
      return;
    }
    
    // Check if any selected table is already part of a merge
    const alreadyMerged = mergedTables.some(m => m.tableIds.some(id => selectedTableIds.includes(id)));
    if (alreadyMerged) {
      toast({ title: "Merge Conflict", description: "One or more tables are already merged.", variant: "destructive" });
      return;
    }

    const tableNumbers = selectedTableIds
      .map(id => tables.find(t => t.id === id)?.table_number || "")
      .filter(Boolean)
      .sort();
    
    const mergeName = tableNumbers.join(" + ");
    const newMerge = {
      id: Math.random().toString(36).substring(7),
      tableIds: [...selectedTableIds],
      name: mergeName
    };

    const updatedMerges = [...mergedTables, newMerge];
    setMergedTables(updatedMerges);
    localStorage.setItem(`zappy_merges_${restaurantId}`, JSON.stringify(updatedMerges));
    
    // Set all merged tables status to Occupied/Reserved or same status
    selectedTableIds.forEach(id => {
      handleStatusChange(id, "occupied");
    });

    logActivity({
      restaurantId,
      action: `Merged tables into ${mergeName}`,
      tableName: "tables",
      newValues: { merged_table_numbers: tableNumbers }
    });

    setSelectedTableIds([]);
    toast({ title: "Tables Merged", description: `Merged into ${mergeName}` });
  };

  // Split selected merge
  const handleSplitTables = (mergeId: string) => {
    const merge = mergedTables.find(m => m.id === mergeId);
    if (!merge) return;

    const updatedMerges = mergedTables.filter(m => m.id !== mergeId);
    setMergedTables(updatedMerges);
    localStorage.setItem(`zappy_merges_${restaurantId}`, JSON.stringify(updatedMerges));

    // Reset status back to available
    merge.tableIds.forEach(id => {
      handleStatusChange(id, "available");
    });

    logActivity({
      restaurantId,
      action: `Split merged table ${merge.name}`,
      tableName: "tables",
      oldValues: { split_tables: merge.name }
    });

    toast({ title: "Tables Split", description: `Split merged table ${merge.name}` });
  };

  // Open assign waiter modal
  const openAssignWaiterModal = (table: any) => {
    setSelectedTableForAssign(table);
    // Find if already assigned
    const currentWaiter = waiters.find(w => w.full_name === assignments[table.id]);
    setSelectedWaiterForAssign(currentWaiter?.id || "none");
    setAssignModalOpen(true);
  };

  const handleAssignWaiterSubmit = async () => {
    if (!selectedTableForAssign) return;
    try {
      const tableId = selectedTableForAssign.id;
      
      // Unassign existing active assignments for this table
      await supabase
        .from("employee_assignments")
        .update({ unassigned_at: new Date().toISOString() })
        .eq("restaurant_id", restaurantId)
        .eq("table_id", tableId)
        .is("unassigned_at", null);

      if (selectedWaiterForAssign !== "none") {
        const waiter = waiters.find(w => w.id === selectedWaiterForAssign);
        // Create new assignment
        const { error } = await supabase
          .from("employee_assignments")
          .insert({
            restaurant_id: restaurantId,
            employee_id: selectedWaiterForAssign,
            table_id: tableId,
            assigned_at: new Date().toISOString()
          });

        if (error) throw error;
        refetchAssignments();

        logActivity({
          restaurantId,
          action: `Assigned waiter ${waiter.full_name} to Table ${selectedTableForAssign.table_number}`,
          tableName: "employee_assignments",
          recordId: tableId,
          newValues: { waiter: waiter.full_name, table: selectedTableForAssign.table_number }
        });

        toast({ title: "Waiter Assigned", description: `${waiter.full_name} assigned to Table ${selectedTableForAssign.table_number}` });
      } else {
        refetchAssignments();

        logActivity({
          restaurantId,
          action: `Unassigned waiter from Table ${selectedTableForAssign.table_number}`,
          tableName: "employee_assignments",
          recordId: tableId
        });

        toast({ title: "Waiter Unassigned" });
      }

      setAssignModalOpen(false);
    } catch (e: any) {
      toast({ title: "Failed to assign waiter", description: e.message, variant: "destructive" });
    }
  };

  // Helper: Find active bill/total for a table from orders
  const getTableBillInfo = (tableId: string) => {
    const activeOrder = orders.find(
      (o) => o.table_id === tableId && o.status !== "completed" && o.status !== "cancelled"
    );
    if (!activeOrder) return { hasOrder: false, bill: 0, time: "", since: "" };
    
    const minutes = Math.floor((Date.now() - new Date(activeOrder.created_at).getTime()) / 60000);
    const duration = minutes < 1 ? "Just seated" : `${minutes}m ago`;
    const since = new Date(activeOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      hasOrder: true,
      bill: Number(activeOrder.total_amount || 0),
      time: duration,
      since: since
    };
  };

  // Group tables by section
  const sections = ["Main Hall", "VIP Lounge", "Balcony", "Garden"];

  // Filter out tables that are currently merged into a visual merge card
  const mergedIdsList = mergedTables.flatMap(m => m.tableIds);
  const standaloneTables = tables.filter(t => !mergedIdsList.includes(t.id));

  // Summary Metrics Calculations
  const totalTablesCount = tables.length;
  const availableCount = tables.filter(t => t.status === "available" || !t.status).length;
  const occupiedCount = tables.filter(t => t.status === "occupied").length;
  const fullCount = tables.filter(t => t.status === "full").length;
  const reservedCount = tables.filter(t => t.status === "reserved").length;
  
  const activeGuestsCount = allSeatOccupancy.length;
  const totalCapacity = tables.reduce((sum, t) => sum + (t.capacity || 0), 0);
  const occupancyPercent = totalCapacity > 0 ? Math.round((activeGuestsCount / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        {selectedTableIds.length >= 2 && (
          <Button onClick={handleMergeTables} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-1 shadow-md shadow-blue-500/20">
            <Combine className="w-4 h-4" /> Merge ({selectedTableIds.length})
          </Button>
        )}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 shadow-sm rounded-2xl">
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tables</span>
            <span className="text-2xl font-black mt-1">{totalTablesCount}</span>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50 shadow-sm rounded-2xl">
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-xs font-bold text-green-600 dark:text-green-500 uppercase tracking-wider">Available</span>
            <span className="text-2xl font-black text-green-700 dark:text-green-400 mt-1">{availableCount}</span>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 shadow-sm rounded-2xl">
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider">Occupied</span>
            <span className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-1">{occupiedCount}</span>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 shadow-sm rounded-2xl">
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">Reserved</span>
            <span className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">{reservedCount}</span>
          </CardContent>
        </Card>
        <Card className="bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/50 shadow-sm rounded-2xl relative overflow-hidden">
          <CardContent className="p-4 flex flex-col justify-center relative z-10">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-500 uppercase tracking-wider">Active Guests</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{activeGuestsCount}</span>
              <span className="text-sm font-bold text-indigo-400 dark:text-indigo-600">/ {totalCapacity}</span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 h-1.5 bg-indigo-500 transition-all duration-1000 ease-out" style={{ width: `${occupancyPercent}%` }} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Floor Visual Grid (Left 3 columns) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Render Merged Tables first if any */}
          {mergedTables.length > 0 && (
            <Card className="border-2 border-dashed border-blue-200 bg-blue-50/20 rounded-3xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-blue-800 flex items-center gap-2">
                  <Combine className="w-4 h-4" /> Merged Dining Tables
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {mergedTables.map(m => {
                    // Combine capacities & bills
                    const childTables = m.tableIds.map(id => tables.find(t => t.id === id)).filter(Boolean);
                    const totalCap = childTables.reduce((sum, t) => sum + (t?.capacity || 0), 0);
                    const bills = m.tableIds.map(id => getTableBillInfo(id));
                    const totalBill = bills.reduce((sum, b) => sum + b.bill, 0);
                    const hasOrder = bills.some(b => b.hasOrder);
                    
                    return (
                      <Card key={m.id} className="border border-blue-200 shadow-sm relative overflow-hidden bg-white flex flex-col min-h-[160px]">
                        <CardContent className="p-4 flex flex-col justify-between flex-grow">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="font-black text-lg text-blue-900">{m.name}</span>
                              <Badge className="bg-blue-600 text-white border-0 text-[10px]">MERGED</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                              <Coffee className="w-3.5 h-3.5" /> {totalCap} Seats
                            </div>
                          </div>
                          
                          <div className="border-t pt-3 mt-3 space-y-1">
                            {hasOrder ? (
                              <div className="flex justify-between text-xs">
                                <span className="font-semibold text-blue-800">Bill: ₹{totalBill.toFixed(0)}</span>
                                <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Active</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">No active bill</span>
                            )}
                          </div>

                          <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t">
                            <Button size="sm" variant="ghost" className="text-destructive h-8 px-2.5 rounded-lg text-xs" onClick={() => handleSplitTables(m.id)}>
                              <Split className="w-3.5 h-3.5 mr-1" /> Split
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Render Standalone Tables by Section */}
          {sections.map(section => {
            const sectionTables = standaloneTables.filter(t => (sectionsMap[t.id] || "Main Hall") === section);
            if (sectionTables.length === 0) return null;

            return (
              <Card key={section} className="border-0 shadow-sm rounded-3xl bg-white dark:bg-zinc-950">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                    {section}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {sectionTables.map(table => {
                      const isSelected = selectedTableIds.includes(table.id);
                      const billInfo = getTableBillInfo(table.id);
                      const waiterName = assignments[table.id];
                      
                      const tableSeatsOccupied = allSeatOccupancy.filter(s => s.table_id === table.id).length;
                      
                      // Status mapping colors
                      let statusBg = "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400";
                      let indicatorColor = "bg-green-500";
                      if (table.status === "occupied") {
                        statusBg = "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400";
                        indicatorColor = "bg-blue-500";
                      } else if (table.status === "full") {
                        statusBg = "bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-400";
                        indicatorColor = "bg-purple-500";
                      } else if (table.status === "reserved") {
                        statusBg = "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400";
                        indicatorColor = "bg-amber-500";
                      } else if (table.status === "needs_cleaning") {
                        statusBg = "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400";
                        indicatorColor = "bg-rose-500";
                      }

                      return (
                        <Card 
                          key={table.id} 
                          onClick={() => handleSelectTable(table.id)}
                          className={`border cursor-pointer transition-all flex flex-col min-h-[175px] ${
                            isSelected ? "ring-2 ring-primary border-primary" : "hover:border-slate-300"
                          }`}
                        >
                          <CardContent className="p-4 flex flex-col justify-between flex-grow">
                            {/* Card Top */}
                            <div>
                              <div className="flex justify-between items-start">
                                <span className="font-extrabold text-lg">Table {table.table_number}</span>
                                <Badge variant="outline" className={`text-[10px] capitalize font-bold gap-1.5 px-2.5 h-6 rounded-full border-2 ${statusBg}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${indicatorColor} ${table.status === 'occupied' || table.status === 'reserved' || table.status === 'full' ? 'animate-pulse' : ''}`} />
                                  {table.status?.replace('_', ' ') || "available"}
                                </Badge>
                              </div>
                              <div className="text-xs font-semibold text-muted-foreground mt-2 flex items-center gap-2">
                                <Users className="w-3.5 h-3.5" /> 
                                {(() => {
                                  return (
                                    <span className={tableSeatsOccupied > 0 ? "text-slate-900 dark:text-slate-100" : ""}>
                                      {tableSeatsOccupied}/{table.capacity}
                                    </span>
                                  );
                                })()} Guests
                              </div>
                            </div>

                            {/* Card Bill Info */}
                            {billInfo.hasOrder && (
                              <div className="border-t pt-3 mt-3 bg-slate-50/50 dark:bg-slate-900/50 -mx-4 px-4 pb-2">
                                <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                                  <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                                    <DollarSign className="w-3.5 h-3.5 mr-0.5" /> {billInfo.bill.toFixed(2)}
                                  </span>
                                  <span className="text-slate-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-blue-500" /> Since {billInfo.since}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Card Reservation Info */}
                            {table.status === "reserved" && reservationsMap[table.id] && (
                              <div className="border-t pt-2 mt-2">
                                <div className="flex justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 bg-amber-50/50 dark:bg-amber-950/20 p-1.5 rounded-lg border border-amber-100 dark:border-amber-900/50">
                                  <span>Res: {reservationsMap[table.id].time}</span>
                                  <span className="text-muted-foreground truncate max-w-[80px]" title={reservationsMap[table.id].name}>
                                    👤 {reservationsMap[table.id].name}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Card Footer Actions */}
                            <div className="flex items-center justify-between gap-1 mt-3 pt-2 border-t" onClick={e => e.stopPropagation()}>
                              <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[100px]" title={waiterName}>
                                {waiterName ? `Waiter: ${waiterName.split(' ')[0]}` : "No Waiter"}
                              </span>
                              <div className="flex items-center gap-1">
                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-slate-500" onClick={() => openAssignWaiterModal(table)} title="Assign Waiter">
                                  <UserPlus className="w-3.5 h-3.5" />
                                </Button>
                                <Select value={table.status} onValueChange={(val) => handleStatusChange(table.id, val)}>
                                  <SelectTrigger className="w-[100px] h-7 text-[10px] rounded-lg">
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="available">Available</SelectItem>
                                    <SelectItem value="reserved">Reserved</SelectItem>
                                    <SelectItem value="occupied">Occupied</SelectItem>
                                    <SelectItem value="needs_cleaning">Cleaning</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDeleteTable(table)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Create Table Side Panel (Right 1 column) */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm rounded-3xl bg-white dark:bg-zinc-950">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create Table
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Table Number</Label>
                <Input
                  value={newTableNumber}
                  onChange={e => setNewTableNumber(e.target.value)}
                  placeholder="e.g. 10, T12"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Capacity (Seats)</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={newCapacity}
                  onChange={e => setNewCapacity(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Section Floor</Label>
                <Select value={newSection} onValueChange={setNewSection}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map(sec => (
                      <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleAddTable} disabled={createTable.isPending} className="w-full rounded-2xl h-11 font-bold mt-2">
                {createTable.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Add Table
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats Legend */}
          <Card className="border-0 shadow-sm rounded-3xl bg-white dark:bg-zinc-950">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-muted-foreground" /> Floor Legend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-green-500 block shrink-0" />
                <span className="font-medium">🟢 Available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-amber-500 block shrink-0" />
                <span className="font-medium">🟡 Reserved</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-blue-500 block shrink-0" />
                <span className="font-medium">🔵 Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-rose-500 block shrink-0" />
                <span className="font-medium">🔴 Needs Cleaning</span>
              </div>
              <p className="text-[10px] text-muted-foreground border-t pt-2 mt-2">
                * Select multiple tables by clicking them and click "Merge" to group tables for larger groups.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assign Waiter Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl" aria-describedby="assign-desc">
          <DialogHeader>
            <DialogTitle>Assign Waiter</DialogTitle>
            <DialogDescription id="assign-desc">
              Select a waiter to assign to Table {selectedTableForAssign?.table_number}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Select Waiter Staff</Label>
              <Select value={selectedWaiterForAssign} onValueChange={setSelectedWaiterForAssign}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Waiter (Unassigned)</SelectItem>
                  {waiters.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAssignWaiterSubmit} className="w-full rounded-2xl h-11 font-bold mt-2">
              Apply Assignment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table Reservation Modal */}
      <Dialog open={reserveModalOpen} onOpenChange={setReserveModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl" aria-describedby="reserve-desc">
          <DialogHeader>
            <DialogTitle>Reserve Table</DialogTitle>
            <DialogDescription id="reserve-desc">
              Enter reservation time and customer name for Table {selectedTableForReserve?.table_number}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Reservation Time</Label>
              <Input
                type="time"
                value={reservationTime}
                onChange={e => setReservationTime(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Customer Name (Optional)</Label>
              <Input
                placeholder="Guest Name"
                value={reservationName}
                onChange={e => setReservationName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <Button onClick={handleReserveSubmit} className="w-full rounded-2xl h-11 font-bold mt-2">
              Apply Reservation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <TableDeleteConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDeleteTable}
        tableNumber={tableToDelete?.table_number || ""}
        loading={deletingTableInProgress}
        dependencyCounts={dependencyCounts}
      />
    </div>
  );
}
