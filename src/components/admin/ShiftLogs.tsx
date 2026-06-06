import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { calculateShiftStats } from "@/utils/shiftCalculations";

export function ShiftLogs({ restaurantId }: { restaurantId: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      if (!restaurantId) return;

      const { data, error } = await supabase
        .from('employee_attendance')
        .select(`
          *,
          employees:employee_id(full_name, role)
        `)
        .eq('restaurant_id', restaurantId)
        .order('login_time', { ascending: false })
        .limit(100);

      if (error) {
        console.error(error);
      } else {
        setLogs(data || []);
      }
      setLoading(false);
    }

    loadLogs();
  }, [restaurantId]);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Shift Logs</h2>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Login Time</TableHead>
              <TableHead>Logout Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Hours Worked</TableHead>
              <TableHead className="text-right text-red-500">Overtime</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center">No shift logs found.</TableCell></TableRow>
            ) : (
              logs.map(log => {
                const stats = calculateShiftStats({
                  loginTime: new Date(log.login_time),
                  logoutTime: log.logout_time ? new Date(log.logout_time) : null,
                  breakMinutes: log.total_break_minutes || 0
                });

                return (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.employees?.full_name || 'Unknown'}</TableCell>
                    <TableCell><Badge variant="outline">{log.employees?.role?.replace('_', ' ')}</Badge></TableCell>
                    <TableCell>{format(new Date(log.login_time), 'PP p')}</TableCell>
                    <TableCell>{log.logout_time ? format(new Date(log.logout_time), 'PP p') : '-'}</TableCell>
                    <TableCell>
                      {log.logout_time ? (
                        <Badge variant="secondary">Completed</Badge>
                      ) : (
                        <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">{stats.formattedWorked}</TableCell>
                    <TableCell className="text-right text-red-500 font-medium">{stats.overtimeMinutes > 0 ? stats.formattedOvertime : '-'}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
