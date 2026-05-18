import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  Percent,
  DollarSign,
  MousePointerClick,
  Eye,
  Award,
  Sparkles,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingDown,
  Activity
} from 'lucide-react';
import { analyticsService } from '@/services/analyticsService';

interface MarketingAnalyticsDashboardProps {
  restaurantId: string;
}

export function MarketingAnalyticsDashboard({ restaurantId }: MarketingAnalyticsDashboardProps) {
  const [days, setDays] = useState(30);
  const queryClient = useQueryClient();

  // 1. Fetch aggregated real analytics report from database
  const { data: report, isLoading } = useQuery({
    queryKey: ['marketing-live-analytics', restaurantId, days],
    queryFn: () => analyticsService.getLiveAnalyticsReport(restaurantId, days),
    staleTime: 5000, // 5 seconds cache
  });

  // 2. Real-time PostgreSQL subscription to update metrics immediately on customer interactions!
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`marketing-realtime-dashboard-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'campaign_events' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['marketing-live-analytics', restaurantId, days] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'coupon_redemptions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['marketing-live-analytics', restaurantId, days] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, days, queryClient]);

  // Derived calculations
  const impressions = report?.impressions || 0;
  const clicks = report?.clicks || 0;
  const ctr = report?.ctr || '0.0';
  const redemptions = report?.redemptions || 0;
  const marketingRevenue = report?.revenue || 0;
  const campaignsList = report?.campaignsList || [];
  const couponsList = report?.couponsList || [];

  // Calculate Conversion Rate: (coupon_redemptions / clicks) * 100
  const conversionRate = clicks > 0 ? ((redemptions / clicks) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Time Filtering and Realtime Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/40 p-4 rounded-2xl border">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5 text-zinc-900 dark:text-zinc-50">
              Live Campaign Engine
              <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-0 text-[10px] font-bold h-4">Real-time Connected</Badge>
            </h3>
            <p className="text-xs text-muted-foreground">Streaming live impressions, swipes, and click-through orders</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select 
            value={String(days)} 
            onValueChange={(val) => setDays(Number(val))}
          >
            <SelectTrigger className="w-[140px] h-9 rounded-xl bg-white dark:bg-zinc-950">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="1">Today</SelectItem>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Live Analytics Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Impressions */}
        <Card className="border-0 shadow-md bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Total Ad Impressions
              <Eye className="w-4 h-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-50">{impressions.toLocaleString()}</span>
              {impressions > 0 && (
                <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/10 text-[10px] gap-0.5 border-0 font-bold">
                  <TrendingUp className="w-2.5 h-2.5" />
                  Live Views
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Live customer views on home/menu slides</p>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
        </Card>

        {/* Card 2: Clicks */}
        <Card className="border-0 shadow-md bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Ad CTA Clicks
              <MousePointerClick className="w-4 h-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-50">{clicks.toLocaleString()}</span>
              {clicks > 0 ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 text-[10px] gap-0.5 border-0 font-bold">
                  <TrendingUp className="w-2.5 h-2.5" />
                  Active Link
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[9px] border-zinc-200 text-zinc-400">Waiting</Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Deep links, coupons applied & scroll clicks</p>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
        </Card>

        {/* Card 3: CTR */}
        <Card className="border-0 shadow-md bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Average CTR %
              <Percent className="w-4 h-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-50">{ctr}%</span>
              <Badge className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/10 text-[10px] gap-0.5 border-0 font-bold">
                Calculated
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Ad impression to click-through conversion</p>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-pink-500" />
        </Card>

        {/* Card 4: Campaign Revenue */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              Attributed Revenue
              <DollarSign className="w-4 h-4 text-amber-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400">₹{marketingRevenue.toLocaleString()}</span>
              <Badge className="bg-amber-400/20 text-amber-400 border-0 text-[10px] font-bold">
                Direct
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Revenues generated directly via active promo coupons</p>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
        </Card>
      </div>

      {/* Main Charts / Layout Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Grid: Ad Campaign CTR Performance Matrix */}
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Active Campaign Performance Matrix
            </CardTitle>
            <CardDescription>Real ROI details and CTR ratings of active database banner advertisements.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">Calculating live metrics...</span>
              </div>
            ) : campaignsList.length > 0 ? (
              campaignsList.map((camp) => {
                const percentage = Math.min(Number(camp.ctr) * 4, 100); // Scale for visual feedback
                return (
                  <div key={camp.id} className="space-y-2 border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-current animate-pulse" />
                        {camp.title}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        {camp.ctr}% CTR ({camp.clicks} clicks | {camp.impressions} views)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={percentage || 5} className="h-2 bg-slate-100 dark:bg-zinc-800 flex-1" />
                      {camp.revenue > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          ₹{camp.revenue.toLocaleString()} sales
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10">
                <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground font-medium">No campaign events tracked in the selected time range.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Grid: Coupon Conversion Distribution */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-500" />
              Coupon Redemptions
            </CardTitle>
            <CardDescription>High-performing promo code details from database events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : couponsList.length > 0 ? (
              couponsList.map((coupon) => (
                <div key={coupon.code} className="flex items-center justify-between p-3 rounded-xl bg-[#f8fafc] dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800 dark:text-zinc-200">{coupon.code}</span>
                    <span className="text-[9px] text-muted-foreground font-medium">₹{coupon.sales.toLocaleString()} aggregated sales</span>
                  </div>
                  <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white font-mono text-[10px] h-5 rounded-full px-2.5">
                    {coupon.redemptionsCount} Redemptions
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <Award className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs text-muted-foreground font-medium">No verified redemptions recorded.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
