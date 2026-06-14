import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WaiterManagement } from "./WaiterManagement";
import { ShiftLogs } from "./ShiftLogs";
import { logActivity } from "@/services/auditLogger";
import { 
  Clock, Calendar, CheckSquare, Users, Timer, 
  MapPin, ShieldAlert, Plus, Loader2, Award, History,
  RefreshCw, Play
} from "lucide-react";
import { format } from "date-fns";

interface StaffManagementProps {
  restaurantId: string;
}

export function StaffManagement({ restaurantId }: StaffManagementProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [activeShiftEmployees, setActiveShiftEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Shift Setup Form State
  const [shiftName, setShiftName] = useState("Morning Shift");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");
  const [breakDuration, setBreakDuration] = useState("30");
  const [selectedEmpForShift, setSelectedEmpForShift] = useState("");
  const [isCreatingShift, setIsCreatingShift] = useState(false);

  // Clock-in Simulator Form State
  const [selectedEmpForClock, setSelectedEmpForClock] = useState("");
  const [gpsVerified, setGpsVerified] = useState(true);
  const [isClocking, setIsClocking] = useState(false);

  // Metrics state
  const [metrics, setMetrics] = useState({
    hoursWorked: 0,
    lateArrivals: 0,
    absentDays: 0,
    overtimeHours: 0
  });

  useEffect(() => {
    loadData();
  }, [restaurantId]);

  async function loadData() {
    if (!restaurantId) return;
    setLoading(true);
    try {
      // Load employees
      const { data: empData } = await supabase
        .from("employees")
        .select("*")
        .eq("restaurant_id", restaurantId);
      setEmployees(empData || []);

      // Load shifts
      const { data: shiftData } = await supabase
        .from("employee_shifts")
        .select("*, employees(full_name, role)")
        .eq("restaurant_id", restaurantId)
        .order("scheduled_start", { ascending: false });
      setShifts(shiftData || []);

      // Load active clocked-in employees
      const { data: activeAttendance } = await supabase
        .from("employee_attendance")
        .select("*, employees(full_name, role, status)")
        .eq("restaurant_id", restaurantId)
        .is("logout_time", null);
      setActiveShiftEmployees(activeAttendance || []);

      // Calculate simple summary metrics from logs
      const { data: history } = await supabase
        .from("employee_attendance")
        .select("*")
        .eq("restaurant_id", restaurantId);
      
      let totalMinutes = 0;
      let totalOvertimeMinutes = 0;
      let lateCount = 0;

      history?.forEach(log => {
        totalMinutes += log.total_worked_minutes || 0;
        totalOvertimeMinutes += log.overtime_minutes || 0;
        
        // Simple mock rule: if logged in after 9:15 AM (or shift start + 15m), count as late
        const hour = new Date(log.login_time).getHours();
        const min = new Date(log.login_time).getMinutes();
        if (hour > 9 || (hour === 9 && min > 15)) {
          lateCount++;
        }
      });

      setMetrics({
        hoursWorked: Math.round(totalMinutes / 60),
        lateArrivals: lateCount,
        absentDays: employees.length > 0 ? Math.max(0, 3 - Math.floor(history?.length / employees.length)) : 0,
        overtimeHours: Math.round(totalOvertimeMinutes / 60)
      });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed to load staff data", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // Create Shift Schedule
  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpForShift) {
      toast({ title: "Select an employee first", variant: "destructive" });
      return;
    }
    setIsCreatingShift(true);

    try {
      // Calculate times
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const date = String(today.getDate()).padStart(2, "0");

      const startISO = `${year}-${month}-${date}T${startTime}:00Z`;
      const endISO = `${year}-${month}-${date}T${endTime}:00Z`;

      const start = new Date(startISO).getTime();
      const end = new Date(endISO).getTime();
      const diffHrs = (end - start) / 3600000;

      const { error, data } = await supabase
        .from("employee_shifts")
        .insert({
          restaurant_id: restaurantId,
          employee_id: selectedEmpForShift,
          shift_name: shiftName,
          scheduled_start: startISO,
          scheduled_end: endISO,
          expected_hours: diffHrs > 0 ? diffHrs : 8
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Shift Scheduled", description: `Assigned ${shiftName} to employee.` });
      setIsCreatingShift(false);
      setSelectedEmpForShift("");
      loadData();
      
      logActivity({
        restaurantId,
        action: "Schedule Shift",
        tableName: "employee_shifts",
        recordId: data?.id,
        newValues: {
          employee_id: selectedEmpForShift,
          shift_name: shiftName,
          scheduled_start: startISO,
          scheduled_end: endISO
        }
      });
    } catch (err: any) {
      toast({ title: "Failed to create shift", description: err.message, variant: "destructive" });
      setIsCreatingShift(false);
    }
  };

  // Clock In Simulator
  const handleClockInSimulator = async () => {
    if (!selectedEmpForClock) {
      toast({ title: "Select employee", variant: "destructive" });
      return;
    }
    if (!gpsVerified) {
      toast({ title: "GPS Error", description: "GPS verification is required to clock in.", variant: "destructive" });
      return;
    }
    setIsClocking(true);

    try {
      // Update employee status
      const { error: empError } = await supabase
        .from("employees")
        .update({ status: "ACTIVE" })
        .eq("id", selectedEmpForClock);

      if (empError) throw empError;

      // Insert attendance entry
      const { error: attError, data: attData } = await supabase
        .from("employee_attendance")
        .insert({
          restaurant_id: restaurantId,
          employee_id: selectedEmpForClock,
          login_time: new Date().toISOString()
        })
        .select()
        .single();

      if (attError) throw attError;

      toast({ title: "Successful Clock-In", description: "Employee clocked in via GPS simulator." });
      setSelectedEmpForClock("");
      loadData();

      logActivity({
        restaurantId,
        action: "Clock In",
        tableName: "employee_attendance",
        recordId: attData?.id,
        newValues: {
          employee_id: selectedEmpForClock,
          login_time: new Date().toISOString(),
          gps_verified: gpsVerified
        }
      });
    } catch (err: any) {
      toast({ title: "Clock-In Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsClocking(false);
    }
  };

  // Clock Out
  const handleClockOut = async (attendance: any) => {
    try {
      const login = new Date(attendance.login_time).getTime();
      const logout = Date.now();
      const worked = Math.floor((logout - login) / 60000);

      // Update employee status
      await supabase
        .from("employees")
        .update({ status: "OFF_DUTY" })
        .eq("id", attendance.employee_id);

      // Update attendance entry
      const { data: updatedAtt } = await supabase
        .from("employee_attendance")
        .update({
          logout_time: new Date().toISOString(),
          total_worked_minutes: worked,
          overtime_minutes: worked > 480 ? worked - 480 : 0
        })
        .eq("id", attendance.id)
        .select()
        .single();

      toast({ title: "Clocked Out", description: `Clocked out successfully. Duration: ${Math.round(worked / 60)} hrs.` });
      loadData();

      logActivity({
        restaurantId,
        action: "Clock Out",
        tableName: "employee_attendance",
        recordId: attendance.id,
        newValues: {
          logout_time: new Date().toISOString(),
          total_worked_minutes: worked,
          overtime_minutes: worked > 480 ? worked - 480 : 0
        }
      });
    } catch (err: any) {
      toast({ title: "Clock-Out Failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex justify-between items-center bg-card p-6 border rounded-3xl shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Staff & Shifts</h2>
          <p className="text-sm text-muted-foreground">Manage employees, timetables, shifts, and attendance dashboards.</p>
        </div>
        <Button onClick={loadData} variant="outline" className="rounded-xl gap-1.5">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm rounded-2xl bg-white dark:bg-zinc-950">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500"><Clock className="w-5 h-5" /></div>
            <div>
              <div className="text-[10px] text-muted-foreground font-semibold">Hours Worked</div>
              <div className="text-xl font-black">{metrics.hoursWorked} hrs</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm rounded-2xl bg-white dark:bg-zinc-950">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500"><ShieldAlert className="w-5 h-5" /></div>
            <div>
              <div className="text-[10px] text-muted-foreground font-semibold">Late Arrivals</div>
              <div className="text-xl font-black">{metrics.lateArrivals} times</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm rounded-2xl bg-white dark:bg-zinc-950">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500"><Calendar className="w-5 h-5" /></div>
            <div>
              <div className="text-[10px] text-muted-foreground font-semibold">Absent Days</div>
              <div className="text-xl font-black">{metrics.absentDays} days</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm rounded-2xl bg-white dark:bg-zinc-950">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-green-500/10 text-green-500"><Timer className="w-5 h-5" /></div>
            <div>
              <div className="text-[10px] text-muted-foreground font-semibold">Overtime Worked</div>
              <div className="text-xl font-black">{metrics.overtimeHours} hrs</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl w-fit">
          <TabsTrigger value="attendance" className="rounded-lg px-4 py-2 text-xs font-semibold gap-1.5">
            <CheckSquare className="w-4 h-4" /> Attendance Floor
          </TabsTrigger>
          <TabsTrigger value="shifts" className="rounded-lg px-4 py-2 text-xs font-semibold gap-1.5">
            <Calendar className="w-4 h-4" /> Shift Scheduler
          </TabsTrigger>
          <TabsTrigger value="directory" className="rounded-lg px-4 py-2 text-xs font-semibold gap-1.5">
            <Users className="w-4 h-4" /> Staff Directory
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-lg px-4 py-2 text-xs font-semibold gap-1.5">
            <History className="w-4 h-4" /> Historical Logs
          </TabsTrigger>
        </TabsList>

        {/* 1. Attendance Floor Content */}
        <TabsContent value="attendance" className="outline-none space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Clock-in Simulator (Left 1 column) */}
            <Card className="border-0 shadow-sm rounded-3xl bg-white dark:bg-zinc-950">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> GPS Clock-In Simulator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs">Select Employee</Label>
                  <Select value={selectedEmpForClock} onValueChange={setSelectedEmpForClock}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Choose employee..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employees
                        .filter(e => e.status !== "ACTIVE")
                        .map(e => (
                          <SelectItem key={e.id} value={e.id}>{e.full_name} ({e.role.replace('_', ' ')})</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-900 border rounded-2xl">
                  <input
                    type="checkbox"
                    id="gps-checkbox"
                    checked={gpsVerified}
                    onChange={e => setGpsVerified(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary shrink-0"
                  />
                  <Label htmlFor="gps-checkbox" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    Verify GPS Geofence Location Match (Within 100m)
                  </Label>
                </div>

                <Button onClick={handleClockInSimulator} disabled={isClocking} className="w-full rounded-2xl h-11 font-bold mt-2">
                  {isClocking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                  Clock In Employee
                </Button>
              </CardContent>
            </Card>

            {/* Currently Active Shifts (Right 2 columns) */}
            <Card className="lg:col-span-2 border-0 shadow-sm rounded-3xl bg-white dark:bg-zinc-950">
              <CardHeader>
                <CardTitle className="text-base font-bold">Currently On-Duty ({activeShiftEmployees.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Login Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeShiftEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          No employees currently clocked in.
                        </TableCell>
                      </TableRow>
                    ) : (
                      activeShiftEmployees.map(att => {
                        const elapsedMins = Math.floor((Date.now() - new Date(att.login_time).getTime()) / 60000);
                        const durationStr = elapsedMins < 60 ? `${elapsedMins}m` : `${Math.floor(elapsedMins / 60)}h ${elapsedMins % 60}m`;
                        return (
                          <TableRow key={att.id}>
                            <TableCell className="font-semibold text-slate-900 dark:text-white">
                              {att.employees?.full_name || "Unknown"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{att.employees?.role?.replace('_', ' ') || "WAITER"}</Badge>
                            </TableCell>
                            <TableCell>{format(new Date(att.login_time), "pp")}</TableCell>
                            <TableCell className="font-mono text-xs">{durationStr}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => handleClockOut(att)}>
                                Clock Out
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. Shift Setup scheduler */}
        <TabsContent value="shifts" className="outline-none space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Shift Form */}
            <Card className="lg:col-span-1 border-0 shadow-sm rounded-3xl bg-white dark:bg-zinc-950">
              <CardHeader>
                <CardTitle className="text-base font-bold">Schedule Shift</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateShift} className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Shift Pattern</Label>
                    <Select value={shiftName} onValueChange={setShiftName}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Morning Shift">Morning (08:00 AM - 04:00 PM)</SelectItem>
                        <SelectItem value="Afternoon Shift">Afternoon (04:00 PM - Midnight)</SelectItem>
                        <SelectItem value="Night Shift">Night (Midnight - 08:00 AM)</SelectItem>
                        <SelectItem value="Custom Shift">Custom Shift</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Employee</Label>
                    <Select value={selectedEmpForShift} onValueChange={setSelectedEmpForShift}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Choose employee..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(e => (
                          <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Start Time</Label>
                      <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">End Time</Label>
                      <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Break Duration (Minutes)</Label>
                    <Input type="number" min="0" value={breakDuration} onChange={e => setBreakDuration(e.target.value)} className="rounded-xl" />
                  </div>

                  <Button type="submit" disabled={isCreatingShift} className="w-full rounded-2xl h-11 font-bold mt-2">
                    {isCreatingShift ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Assign Shift
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Timetable visual */}
            <Card className="lg:col-span-3 border-0 shadow-sm rounded-3xl bg-white dark:bg-zinc-950">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <span>Scheduled Shifts Today</span>
                  <Badge variant="outline">{format(new Date(), "PP")}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead className="text-right">Expected Hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shifts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          No shifts scheduled. Create one on the left panel.
                        </TableCell>
                      </TableRow>
                    ) : (
                      shifts.slice(0, 10).map(shift => (
                        <TableRow key={shift.id}>
                          <TableCell className="font-semibold">{shift.employees?.full_name || "Unknown"}</TableCell>
                          <TableCell><Badge variant="outline" className="bg-slate-50">{shift.shift_name}</Badge></TableCell>
                          <TableCell>{format(new Date(shift.scheduled_start), "p")}</TableCell>
                          <TableCell>{format(new Date(shift.scheduled_end), "p")}</TableCell>
                          <TableCell className="text-right font-mono font-bold">{shift.expected_hours || 8} hrs</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 3. Directory Content */}
        <TabsContent value="directory" className="outline-none">
          <Card className="border-0 shadow-sm rounded-3xl bg-white dark:bg-zinc-950 p-6">
            <WaiterManagement restaurantId={restaurantId} />
          </Card>
        </TabsContent>

        {/* 4. Logs */}
        <TabsContent value="logs" className="outline-none">
          <Card className="border-0 shadow-sm rounded-3xl bg-white dark:bg-zinc-950 p-6">
            <ShiftLogs restaurantId={restaurantId} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
