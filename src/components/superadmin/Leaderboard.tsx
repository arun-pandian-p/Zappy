import { useState } from 'react';
import { Crown, TrendingUp, Award, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Loader2 } from 'lucide-react';

const tierColors: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  pro: 'bg-primary/10 text-primary',
  enterprise: 'bg-accent text-accent-foreground',
};

const rankIcons = [
  <Crown key={0} className="w-6 h-6 text-amber-500" />,
  <Award key={1} className="w-6 h-6 text-slate-400" />,
  <Medal key={2} className="w-6 h-6 text-amber-700" />,
];

export function Leaderboard() {
  const [timeRange, setTimeRange] = useState('all');

  const dateRange = (() => {
    const now = new Date();
    if (timeRange === '7d') return { from: new Date(now.getTime() - 7 * 86400000).toISOString(), to: now.toISOString() };
    if (timeRange === '30d') return { from: new Date(now.getTime() - 30 * 86400000).toISOString(), to: now.toISOString() };
    if (timeRange === '90d') return { from: new Date(now.getTime() - 90 * 86400000).toISOString(), to: now.toISOString() };
    return undefined;
  })();

  const { data: entries = [], isLoading } = useLeaderboard(dateRange);

  const formatCurrency = (val: number) => `₹${val >= 100000 ? (val / 100000).toFixed(1) + 'L' : val.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Revenue Leaderboard
          </h2>
          <p className="text-sm text-muted-foreground">Top performing restaurants by revenue</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : entries.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No revenue data yet</CardContent></Card>
      ) : (
        <>
          {/* Top 3 Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {entries.slice(0, 3).map((entry, i) => (
              <Card key={entry.restaurant_id} className={i === 0 ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-700' : ''}>
                <CardContent className="p-5 text-center space-y-3">
                  <div className="flex justify-center">{rankIcons[i]}</div>
                  <Avatar className="w-14 h-14 mx-auto">
                    <AvatarImage src={entry.logo_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                      {entry.restaurant_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold truncate">{entry.restaurant_name}</p>
                    <Badge variant="secondary" className={tierColors[entry.subscription_tier || 'free']}>
                      {entry.subscription_tier || 'free'}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(entry.total_revenue)}</p>
                  <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                    <span>{entry.order_count} orders</span>
                    <span>Avg {formatCurrency(entry.avg_order_value)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Rest of list */}
          {entries.length > 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">All Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {entries.slice(3, 20).map((entry, i) => (
                    <div key={entry.restaurant_id} className="flex items-center gap-4 py-2 border-b last:border-0">
                      <span className="w-8 text-center font-bold text-muted-foreground">#{i + 4}</span>
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={entry.logo_url || undefined} />
                        <AvatarFallback className="text-xs bg-muted">{entry.restaurant_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{entry.restaurant_name}</p>
                        <p className="text-xs text-muted-foreground">{entry.order_count} orders</p>
                      </div>
                      <Badge variant="secondary" className={`text-xs ${tierColors[entry.subscription_tier || 'free']}`}>
                        {entry.subscription_tier || 'free'}
                      </Badge>
                      <span className="font-semibold text-sm">{formatCurrency(entry.total_revenue)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
