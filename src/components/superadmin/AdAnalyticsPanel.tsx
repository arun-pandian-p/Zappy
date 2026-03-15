import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, MousePointerClick, TrendingUp, DollarSign } from 'lucide-react';
import type { Ad } from '@/hooks/useAds';

interface AdAnalyticsPanelProps {
  ads: Ad[];
}

export function AdAnalyticsPanel({ ads }: AdAnalyticsPanelProps) {
  const stats = useMemo(() => {
    const totalImpressions = ads.reduce((s, a) => s + (a.impressions || 0), 0);
    const totalClicks = ads.reduce((s, a) => s + (a.clicks || 0), 0);
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
    const activeCount = ads.filter(a => a.is_active).length;
    return { totalImpressions, totalClicks, ctr, activeCount };
  }, [ads]);

  const topAds = useMemo(() =>
    [...ads]
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 5),
    [ads]
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Eye className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold">{stats.totalImpressions.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Impressions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10"><MousePointerClick className="w-5 h-5 text-accent-foreground" /></div>
            <div>
              <p className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Clicks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10"><TrendingUp className="w-5 h-5 text-success" /></div>
            <div>
              <p className="text-2xl font-bold">{stats.ctr}%</p>
              <p className="text-xs text-muted-foreground">Click-Through Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10"><DollarSign className="w-5 h-5 text-warning" /></div>
            <div>
              <p className="text-2xl font-bold">{stats.activeCount}</p>
              <p className="text-xs text-muted-foreground">Active Campaigns</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Ads */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Top Performing Ads</CardTitle></CardHeader>
        <CardContent>
          {topAds.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No ad data yet</p>
          ) : (
            <div className="space-y-3">
              {topAds.map((ad, i) => {
                const ctr = (ad.impressions || 0) > 0 ? (((ad.clicks || 0) / (ad.impressions || 1)) * 100).toFixed(1) : '0.0';
                return (
                  <div key={ad.id} className="flex items-center gap-4 p-3 rounded-lg border">
                    <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                    {ad.image_url && <img src={ad.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{ad.title}</p>
                      <p className="text-xs text-muted-foreground">{(ad as any).placement_type || 'popup_offer'} · {(ad as any).campaign_type || 'platform_promotion'}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold">{(ad.clicks || 0).toLocaleString()} clicks</p>
                      <p className="text-muted-foreground">{ctr}% CTR</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
