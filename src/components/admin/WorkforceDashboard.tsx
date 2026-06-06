import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, Flame, CalendarClock, IndianRupee, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function WorkforceDashboard({ restaurantId }: { restaurantId: string }) {
  const [stats, setStats] = useState({
    activeWaiters: 0,
    activeKitchen: 0,
    totalOvertime: 0,
    attendanceRate: 0,
    estimatedCost: 0
  });

  useEffect(() => {
    async function loadStats() {
      if (!restaurantId) return;

      // Active Waiters
      const { count: waiters } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('role', 'WAITER')
        .eq('status', 'ACTIVE');

      // Active Kitchen
      const { count: kitchen } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('role', 'KITCHEN_STAFF')
        .eq('status', 'ACTIVE');

      // Overtime
      const { data: attendance } = await supabase
        .from('employee_attendance')
        .select('overtime_minutes, total_worked_minutes')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(100);

      const totalOvertime = attendance?.reduce((sum, a) => sum + (a.overtime_minutes || 0), 0) || 0;
      const totalWorked = attendance?.reduce((sum, a) => sum + (a.total_worked_minutes || 0), 0) || 0;

      // Assuming an average hourly wage of 100 INR for calculation
      const estimatedCost = (totalWorked / 60) * 100;

      setStats({
        activeWaiters: waiters || 0,
        activeKitchen: kitchen || 0,
        totalOvertime,
        attendanceRate: 94, // Mock calculation for demo purposes
        estimatedCost
      });
    }

    loadStats();
  }, [restaurantId]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Waiters</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeWaiters}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently on the floor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Kitchen Staff</CardTitle>
            <Flame className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeKitchen}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently in the kitchen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Rate</CardTitle>
            <CalendarClock className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">For this week's shifts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Overtime</CardTitle>
            <Timer className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(stats.totalOvertime / 60)}h {stats.totalOvertime % 60}m</div>
            <p className="text-xs text-muted-foreground mt-1">Accumulated this period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Shift Labor Cost</CardTitle>
            <IndianRupee className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Math.round(stats.estimatedCost).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Estimated for current cycle</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
