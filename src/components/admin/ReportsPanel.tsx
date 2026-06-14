import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSystemLogs } from "@/hooks/useSystemLogs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileSpreadsheet, Search, RefreshCw, Key, Tag, Trash2, 
  Info, Calendar, Filter, Database, ArrowRight, ShieldAlert,
  ChevronDown, ChevronUp, Eye
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface ReportsPanelProps {
  restaurantId: string;
}

export function ReportsPanel({ restaurantId }: ReportsPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "SECURITY" | "PRICE_CHANGE" | "DELETION" | "SYSTEM">("ALL");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const [employeesMap, setEmployeesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadEmployees() {
      if (!restaurantId) return;
      try {
        const { data } = await supabase
          .from('employees')
          .select('user_id, full_name')
          .eq('restaurant_id', restaurantId);
        
        const mapping: Record<string, string> = {};
        data?.forEach(emp => {
          if (emp.user_id) mapping[emp.user_id] = emp.full_name;
        });
        setEmployeesMap(mapping);
      } catch (err) {
        console.error("Error loading employees mapping:", err);
      }
    }
    loadEmployees();
  }, [restaurantId]);

  const { logs, isLoading, refetch } = useSystemLogs(restaurantId, searchTerm);

  // Filter logs locally based on categories
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (categoryFilter === "ALL") return true;
      const action = (log.action || "").toLowerCase();
      const entity = (log.table_name || "").toLowerCase();
      
      if (categoryFilter === "SECURITY") {
        return action.includes("login") || action.includes("logout") || action.includes("auth") || action.includes("session");
      }
      if (categoryFilter === "PRICE_CHANGE") {
        const hasPriceInDetail = (log.new_values && JSON.stringify(log.new_values).toLowerCase().includes("price")) ||
                              (log.old_values && JSON.stringify(log.old_values).toLowerCase().includes("price"));
        return action.includes("price") || action.includes("rate") || action.includes("pricing") || hasPriceInDetail;
      }
      if (categoryFilter === "DELETION") {
        return action.includes("delete") || action.includes("remove") || action.includes("destroy");
      }
      if (categoryFilter === "SYSTEM") {
        return entity.includes("system") || entity.includes("settings") || entity.includes("restaurants") || action.includes("config") || action.includes("setting");
      }
      return true;
    });
  }, [logs, categoryFilter]);

  // Aggregate stats from the fetched logs
  const stats = useMemo(() => {
    let logins = 0;
    let priceChanges = 0;
    let deletions = 0;

    logs.forEach(log => {
      const action = (log.action || "").toLowerCase();
      const detailsStr = JSON.stringify({ old: log.old_values, new: log.new_values }).toLowerCase();
      if (action.includes("login")) logins++;
      if (action.includes("price") || detailsStr.includes("price")) priceChanges++;
      if (action.includes("delete") || action.includes("remove")) deletions++;
    });

    return { logins, priceChanges, deletions, total: logs.length };
  }, [logs]);

  // Export logs to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ["ID", "Timestamp", "Actor Name", "Action", "Table Name", "Details", "IP Address", "Device"];
    const rows = filteredLogs.map(log => [
      log.id,
      log.created_at ? format(parseISO(log.created_at), "yyyy-MM-dd HH:mm:ss") : "N/A",
      log.user_id ? (employeesMap[log.user_id] || "Staff Member") : "System/Anonymous",
      log.action,
      log.table_name || "N/A",
      log.new_values || log.old_values ? JSON.stringify({ old: log.old_values, new: log.new_values }).replace(/"/g, '""') : "",
      log.ip_address || "N/A",
      log.device || "N/A"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => `"${r.join('","')}"`)].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_logs_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to choose badge color and icon for a log
  const getLogMeta = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("login") || act.includes("logout") || act.includes("auth")) {
      return {
        icon: Key,
        color: "bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900",
        label: "Security"
      };
    }
    if (act.includes("price") || act.includes("pricing") || act.includes("rate")) {
      return {
        icon: Tag,
        color: "bg-amber-500/10 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900",
        label: "Pricing"
      };
    }
    if (act.includes("delete") || act.includes("remove") || act.includes("destroy")) {
      return {
        icon: Trash2,
        color: "bg-rose-500/10 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900",
        label: "Deletion"
      };
    }
    return {
      icon: Info,
      color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800",
      label: "System"
    };
  };

  return (
    <div className="space-y-6">
      {/* Reports Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-6 border rounded-3xl shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Audit Reports</h2>
          <p className="text-sm text-muted-foreground">Log files tracking administrative events, price changes, and security access points.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => (refetch as any)()} variant="outline" className="rounded-xl gap-1.5">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button onClick={handleExportCSV} variant="outline" className="rounded-xl gap-1.5" disabled={filteredLogs.length === 0}>
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border shadow-sm bg-gradient-to-br from-white to-slate-50/50 dark:from-zinc-950 dark:to-zinc-900/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Login / Logout Sessions</p>
              <p className="text-2xl font-black mt-1 text-blue-600 dark:text-blue-400">{stats.logins}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm bg-gradient-to-br from-white to-slate-50/50 dark:from-zinc-950 dark:to-zinc-900/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Price Modifications</p>
              <p className="text-2xl font-black mt-1 text-amber-600 dark:text-amber-400">{stats.priceChanges}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm bg-gradient-to-br from-white to-slate-50/50 dark:from-zinc-950 dark:to-zinc-900/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Audit Deletions</p>
              <p className="text-2xl font-black mt-1 text-rose-600 dark:text-rose-400">{stats.deletions}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm bg-gradient-to-br from-white to-slate-50/50 dark:from-zinc-950 dark:to-zinc-900/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Total Events Tracked</p>
              <p className="text-2xl font-black mt-1 text-slate-800 dark:text-zinc-100">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Audit Logs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logs List - Left 2 Columns */}
        <Card className="rounded-3xl border shadow-sm lg:col-span-2 flex flex-col overflow-hidden">
          <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-zinc-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold">Activity Logs</CardTitle>
                <CardDescription>Real-time audit trail of actions taken in the dashboard.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={categoryFilter} onValueChange={(v: any) => setCategoryFilter(v)}>
                  <SelectTrigger className="w-[140px] rounded-xl text-xs">
                    <Filter className="w-3.5 h-3.5 mr-1.5 opacity-60" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Events</SelectItem>
                    <SelectItem value="SECURITY">Security / Login</SelectItem>
                    <SelectItem value="PRICE_CHANGE">Price Changes</SelectItem>
                    <SelectItem value="DELETION">Deletions</SelectItem>
                    <SelectItem value="SYSTEM">System Config</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Local search bar */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search actor email, action, or entities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-xl h-9 text-xs"
              />
            </div>
          </CardHeader>
          
          <CardContent className="p-0 overflow-y-auto max-h-[550px] divide-y">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-primary" /> Loading logs from database...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                <ShieldAlert className="w-10 h-10 mb-2 opacity-40 text-slate-400" />
                <p className="font-semibold text-sm">No matching events logged</p>
                <p className="text-xs">Adjust filters or search parameters.</p>
              </div>
            ) : (
              filteredLogs.map(log => {
                const meta = getLogMeta(log.action);
                const LogIcon = meta.icon;
                const isSelected = selectedLog?.id === log.id;
                const isExpanded = expandedLogId === log.id;

                return (
                  <div 
                    key={log.id} 
                    className={`p-4 transition-all duration-200 ${
                      isSelected ? "bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary" : "hover:bg-slate-50/50 dark:hover:bg-zinc-900/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <div className={`p-2.5 rounded-xl border shrink-0 ${meta.color}`}>
                          <LogIcon className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-zinc-100 text-xs sm:text-sm">{log.action}</span>
                            <Badge variant="outline" className={`text-[10px] py-0 px-2 rounded-full ${meta.color}`}>
                              {meta.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            By <span className="font-semibold text-slate-700 dark:text-zinc-300">
                              {log.user_id ? (employeesMap[log.user_id] || "Staff Member") : "System/Anonymous"}
                            </span>
                          </p>
                          <p className="text-[10px] text-muted-foreground flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                              {log.created_at ? format(parseISO(log.created_at), "MMM dd, yyyy · hh:mm a") : "N/A"}
                            </span>
                            {log.ip_address && (
                              <span className="bg-slate-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded text-[9px] font-mono">
                                IP: {log.ip_address}
                              </span>
                            )}
                            {log.device && (
                              <span className="bg-slate-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded text-[9px] truncate max-w-[120px]" title={log.device}>
                                Device: {log.device.split(' ')[0]}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg"
                          onClick={() => setSelectedLog(log)}
                          title="Inspect Audit"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Collapsible details inline */}
                    {isExpanded && (
                      <div className="mt-3 ml-12 bg-slate-50 dark:bg-zinc-900 border rounded-2xl p-4 text-xs font-mono overflow-x-auto space-y-2">
                        <div className="grid grid-cols-2 gap-2 border-b pb-2 mb-2 opacity-75 text-[10px]">
                          <div><strong>Table:</strong> {log.table_name || "N/A"}</div>
                          <div><strong>Record ID:</strong> {log.record_id || "N/A"}</div>
                        </div>
                        <pre className="text-[10px] leading-relaxed text-slate-700 dark:text-zinc-300 whitespace-pre-wrap">
                          {log.new_values || log.old_values ? JSON.stringify({ old: log.old_values, new: log.new_values }, null, 2) : "No details available."}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Audit Inspector Panel - Right Column */}
        <Card className="rounded-3xl border shadow-sm flex flex-col overflow-hidden h-fit">
          <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/50 border-b">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Eye className="w-4.5 h-4.5 text-primary" /> Audit Inspector
            </CardTitle>
            <CardDescription>Comprehensive details of selected audit trail.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {selectedLog ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Action</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm bg-slate-50 dark:bg-zinc-900/50 p-2.5 rounded-xl border">{selectedLog.action}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Table</span>
                    <Badge variant="secondary" className="font-bold text-xs py-0.5 rounded-lg w-fit block">{selectedLog.table_name || "N/A"}</Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Timestamp</span>
                    <p className="text-xs font-medium text-slate-800 dark:text-zinc-200 mt-1">
                      {selectedLog.created_at ? format(parseISO(selectedLog.created_at), "yyyy-MM-dd HH:mm:ss") : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">IP Address</span>
                    <p className="text-xs font-mono font-medium text-slate-800 dark:text-zinc-200 mt-1">
                      {selectedLog.ip_address || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Device / Browser</span>
                    <p className="text-xs font-medium text-slate-800 dark:text-zinc-200 mt-1 truncate" title={selectedLog.device}>
                      {selectedLog.device ? selectedLog.device.split(' ')[0] : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 pt-2">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Actor / Admin Account</span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 bg-slate-50 dark:bg-zinc-900/50 p-2.5 rounded-xl border">
                    {selectedLog.user_id ? (employeesMap[selectedLog.user_id] || "Staff Member") : "System/Anonymous"}
                  </p>
                </div>

                <div className="space-y-1 pt-2">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Payload Details</span>
                  <div className="bg-zinc-950 text-zinc-300 font-mono text-[10px] rounded-2xl p-4 overflow-x-auto max-h-[200px]">
                    <pre className="whitespace-pre-wrap">
                      {selectedLog.new_values || selectedLog.old_values ? JSON.stringify({ old: selectedLog.old_values, new: selectedLog.new_values }, null, 2) : "No details recorded."}
                    </pre>
                  </div>
                </div>

                <div className="border-t pt-4 text-[10px] text-muted-foreground flex justify-between">
                  <span>Log Hash ID:</span>
                  <span className="font-mono truncate max-w-[150px]" title={selectedLog.id}>{selectedLog.id}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
                <ArrowRight className="w-10 h-10 text-slate-300 dark:text-zinc-800 mb-3 animate-pulse" />
                <p className="font-semibold text-sm">No Entry Selected</p>
                <p className="text-xs">Select any log from the table list to audit metadata logs.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
