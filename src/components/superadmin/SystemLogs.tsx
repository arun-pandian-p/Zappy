import { useState } from 'react';
import { Loader2, Search, ScrollText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSystemLogs } from '@/hooks/useSystemLogs';
import { format } from 'date-fns';

export function SystemLogs() {
  const [search, setSearch] = useState('');
  const { logs, isLoading } = useSystemLogs(search || undefined);

  const actionColors: Record<string, string> = {
    create_tenant: 'bg-green-100 text-green-700',
    create_staff: 'bg-blue-100 text-blue-700',
    delete_staff: 'bg-red-100 text-red-700',
    update_settings: 'bg-amber-100 text-amber-700',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2"><ScrollText className="w-5 h-5" />System Logs</CardTitle>
            <CardDescription>Real-time audit trail of platform actions.</CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-[250px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ScrollText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No logs found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm whitespace-nowrap">{format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}</TableCell>
                  <TableCell className="text-sm">{log.actor_email || '-'}</TableCell>
                  <TableCell><Badge className={actionColors[log.action] || 'bg-muted text-muted-foreground'}>{log.action.replace(/_/g, ' ')}</Badge></TableCell>
                  <TableCell className="text-sm">{log.entity_type || '-'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{log.details ? JSON.stringify(log.details) : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
