import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { 
  Star, MessageSquare, AlertCircle, CheckCircle2,
  TrendingUp, Ticket, Brain, RefreshCw, Smartphone, Globe, Sparkles, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { executeOpenAIChatCall } from '@/services/openaiService';

export const ReputationManager = ({ restaurantId }: { restaurantId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'needs_attention' | 'recovered' | 'positive'>('all');

  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insightsReport, setInsightsReport] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);

  // Load cached insights on mount
  useEffect(() => {
    const cached = localStorage.getItem(`zappy_weekly_insights_${restaurantId}`);
    if (cached) {
      setInsightsReport(cached);
      setShowInsights(true);
    }
  }, [restaurantId]);

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant_details_reputation', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('subscription_tier')
        .eq('id', restaurantId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  const subscriptionTier = restaurant?.subscription_tier || 'free';
  const isEnterprise = subscriptionTier === 'enterprise';

  const generateWeeklyInsights = async () => {
    if (reviews.length === 0) {
      toast({
        title: "No Data Available",
        description: "Requires at least one customer review to run insights summary.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingInsights(true);
    try {
      const recentReviews = reviews.slice(0, 15).map((r: any) => ({
        rating: r.overall_rating,
        comment: r.comment || "",
        sentiment: r.review_ai_insights?.[0]?.sentiment || "neutral",
        categories: r.review_ai_insights?.[0]?.complaint_categories || [],
      }));

      const systemPrompt = `You are a high-end restaurant consultant and operations analyst. 
Analyze the recent feedback data and write a clean, structured weekly report.
Identify recurring patterns, systemic operations failures, and actionable fixes.
Use professional tone and markdown bullet lists. Keep it brief.`;

      const userPrompt = `Recent customer feedback logs:
${JSON.stringify(recentReviews, null, 2)}`;

      const report = await executeOpenAIChatCall(
        restaurantId,
        "superadmin_ai_insights",
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      );

      if (report) {
        setInsightsReport(report);
        localStorage.setItem(`zappy_weekly_insights_${restaurantId}`, report);
        setShowInsights(true);
        toast({ title: "Insights Generated", description: "Weekly executive summary is ready." });
      }
    } catch (err: any) {
      toast({
        title: "Generation Failed",
        description: err.message || "Failed to compile weekly report.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['enterprise_reviews', restaurantId],
    queryFn: async () => {
      // Fetch reviews with their AI insights and recovery actions
      try {
        const { data, error } = await supabase
          .from('enterprise_reviews' as any)
          .select(`
            *,
            orders ( 
              order_number,
              customer_name,
              order_items (
                name,
                menu_item_id,
                quantity
              )
            ),
            tables ( table_number ),
            review_ai_insights (*),
            review_recoveries (*)
          `)
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (err: any) {
        if (err.code === '42P01' || err.message?.includes('Could not find the table')) return []; // Fallback if table doesn't exist yet
        throw err;
      }
    },
    enabled: !!restaurantId,
  });

  const { data: ratingAggregate } = useQuery({
    queryKey: ['restaurant_rating_aggregate', restaurantId],
    queryFn: async () => {
      try {
        // Query feedback table directly to compute average rating and count
        // This avoids 404 GET errors on missing materialized views
        const { data: live, error: liveErr } = await supabase
          .from('feedback')
          .select('rating')
          .eq('restaurant_id', restaurantId);

        if (liveErr) {
          console.warn('Feedback table query failed, trying enterprise_reviews:', liveErr);
          const { data: entReviews, error: entErr } = await supabase
            .from('enterprise_reviews' as any)
            .select('overall_rating')
            .eq('restaurant_id', restaurantId);

          if (entErr) {
            console.error('Secondary fallback to enterprise_reviews failed:', entErr);
            return { average_rating: 0, total_reviews: 0 };
          }

          const ratings = (entReviews || []).map((r: any) => Number(r.overall_rating)).filter(Boolean);
          const avg = ratings.length ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) : 0;
          return {
            average_rating: avg,
            total_reviews: ratings.length,
          };
        }

        const ratings = (live || []).map((r: any) => Number(r.rating)).filter(Boolean);
        const avg = ratings.length ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) : 0;
        return {
          average_rating: avg,
          total_reviews: ratings.length,
        };
      } catch (err: any) {
        console.error('Unexpected error fetching rating aggregate:', err);
        return { average_rating: 0, total_reviews: 0 };
      }
    },
    enabled: !!restaurantId,
  });

  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const insight = r.review_ai_insights?.[0];
      const recovery = r.review_recoveries?.[0];
      if (filter === 'needs_attention') return insight?.requires_manager_attention && recovery?.status !== 'resolved';
      if (filter === 'recovered') return recovery?.status === 'resolved' || recovery?.status === 'action_taken';
      if (filter === 'positive') return insight?.sentiment === 'positive';
      return true;
    });
  }, [reviews, filter]);

  // Analytics
  const avgRating = useMemo(() => {
    if (ratingAggregate) {
      return Number(ratingAggregate.average_rating).toFixed(1);
    }
    if (!reviews.length) return '0.0';
    return (reviews.reduce((acc, r) => acc + r.overall_rating, 0) / reviews.length).toFixed(1);
  }, [reviews, ratingAggregate]);

  const totalReviewsCount = useMemo(() => {
    if (ratingAggregate) return ratingAggregate.total_reviews;
    return reviews.length;
  }, [reviews, ratingAggregate]);

  const totalComplaints = useMemo(() => reviews.filter(r => r.review_ai_insights?.[0]?.is_complaint).length, [reviews]);

  // Calculate per-item ratings dynamically from reviews and order items
  const itemRatings = useMemo(() => {
    const itemMap: Record<string, { name: string; totalRating: number; count: number }> = {};
    
    reviews.forEach((review: any) => {
      const items = review.orders?.order_items || [];
      const rating = review.overall_rating;
      if (rating === undefined || rating === null) return;
      
      items.forEach((item: any) => {
        const key = item.menu_item_id || item.name;
        if (!itemMap[key]) {
          itemMap[key] = { name: item.name, totalRating: 0, count: 0 };
        }
        itemMap[key].totalRating += rating;
        itemMap[key].count += 1;
      });
    });
    
    return Object.values(itemMap)
      .map(item => ({
        name: item.name,
        avgRating: item.totalRating / item.count,
        count: item.count
      }))
      .sort((a, b) => b.avgRating - a.avgRating);
  }, [reviews]);

  const markResolved = useMutation({
    mutationFn: async (recoveryId: string) => {
      const { error } = await supabase.from('review_recoveries' as any)
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', recoveryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise_reviews', restaurantId] });
      toast({ title: 'Issue marked as resolved.' });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reputation Center</h2>
          <p className="text-muted-foreground mt-1">AI-powered sentiment analysis and customer recovery.</p>
        </div>
        <div className="flex gap-2">
          {isEnterprise && (
            <Button 
              className="gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl shadow-md hover:scale-105 transition-transform"
              onClick={generateWeeklyInsights}
              disabled={isGeneratingInsights}
            >
              {isGeneratingInsights ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              AI Weekly Insights
            </Button>
          )}
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['enterprise_reviews', restaurantId] })}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Weekly AI Insights Report Card (Enterprise-only) */}
      {isEnterprise && insightsReport && showInsights && (
        <Card className="border-indigo-150 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-950/20">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-indigo-950 dark:text-indigo-100 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600" />
                AI Weekly Operations Insights
              </CardTitle>
              <CardDescription>Generated weekly executive summary based on restaurant complaints & feedback trends</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setShowInsights(false)}>
              Dismiss
            </Button>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none text-sm space-y-2 text-slate-800 dark:text-slate-200">
            <div className="p-4 rounded-xl border border-indigo-100 bg-white/50 dark:bg-black/20 leading-relaxed whitespace-pre-line">
              {insightsReport}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold">Average Rating</span>
            </div>
            <div className="text-3xl font-bold">{avgRating}</div>
            <p className="text-sm text-muted-foreground mt-1">Based on {totalReviewsCount} reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-5 h-5 text-indigo-500" />
              <span className="font-semibold">AI Sentiment</span>
            </div>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {reviews.filter(r => r.review_ai_insights?.[0]?.sentiment === 'positive').length} Positive
              </Badge>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                {reviews.filter(r => r.review_ai_insights?.[0]?.sentiment === 'negative').length} Negative
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              <span className="font-semibold">Total Complaints</span>
            </div>
            <div className="text-3xl font-bold">{totalComplaints}</div>
            <p className="text-sm text-muted-foreground mt-1 text-warning font-medium">
              {reviews.filter(r => r.review_ai_insights?.[0]?.requires_manager_attention).length} needs attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">Google Redirects</span>
            </div>
            <div className="text-3xl font-bold">
              {reviews.filter(r => r.redirected_to_google).length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Happy customers sent to Google</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid Layout: Reviews Feed (Left) & Menu Item Ratings (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Reviews Feed & Filter Tabs (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
              All Reviews ({reviews.length})
            </Button>
            <Button variant={filter === 'needs_attention' ? 'default' : 'outline'} onClick={() => setFilter('needs_attention')} className="gap-2">
              <AlertCircle className="w-4 h-4 text-warning" /> Needs Attention
            </Button>
            <Button variant={filter === 'recovered' ? 'default' : 'outline'} onClick={() => setFilter('recovered')} className="gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" /> Recovered
            </Button>
            <Button variant={filter === 'positive' ? 'default' : 'outline'} onClick={() => setFilter('positive')} className="gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> Positive
            </Button>
          </div>

          {/* Reviews Feed */}
          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-20" />
            <h3 className="text-lg font-medium">No reviews found</h3>
            <p className="text-muted-foreground">Try changing the filter or wait for new reviews.</p>
          </div>
        ) : (
          filteredReviews.map((review: any) => {
            const insight = review.review_ai_insights?.[0];
            const recovery = review.review_recoveries?.[0];

            return (
              <Card key={review.id} className={`overflow-hidden transition-all ${insight?.requires_manager_attention && recovery?.status !== 'resolved' ? 'border-warning shadow-warning/10 shadow-lg' : ''}`}>
                <CardHeader className="bg-muted/30 pb-3 flex flex-row items-start justify-between border-b">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-5 h-5 ${star <= review.overall_rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="font-semibold">
                        {review.tables?.table_number ? `Table ${review.tables.table_number}` : 'Delivery / Takeaway'}
                      </span>
                      <span className="text-sm text-muted-foreground">• Order #{review.orders?.order_number || 'N/A'}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(review.created_at), 'PPP at p')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {insight?.sentiment === 'angry' && <Badge variant="destructive">Angry</Badge>}
                    {insight?.sentiment === 'positive' && <Badge variant="secondary" className="bg-green-100 text-green-800">Positive</Badge>}
                    {review.redirected_to_google && <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50"><Globe className="w-3 h-3 mr-1"/> Sent to Google</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  {review.orders?.customer_name && (
                    <p className="text-xs text-muted-foreground mb-3">
                      Review from <span className="font-semibold text-foreground">{review.orders.customer_name}</span>
                    </p>
                  )}
                  {review.comment ? (
                    <p className="text-foreground leading-relaxed mb-4">"{review.comment}"</p>
                  ) : (
                    <p className="text-muted-foreground italic mb-4">No written feedback provided.</p>
                  )}

                  {/* AI Insights Block */}
                  {insight && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2 text-indigo-700 font-semibold text-sm">
                        <Brain className="w-4 h-4" /> AI Analysis
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {insight.complaint_categories?.map((cat: string) => (
                          <Badge key={cat} variant="secondary" className="bg-red-100 text-red-800">{cat.replace('_', ' ')}</Badge>
                        ))}
                        {insight.positive_highlights?.map((cat: string) => (
                          <Badge key={cat} variant="secondary" className="bg-green-100 text-green-800">{cat.replace('_', ' ')}</Badge>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-indigo-100">
                        <span className="text-xs text-indigo-600 font-medium uppercase tracking-wider">Suggested Reply:</span>
                        <p className="text-sm text-indigo-900 mt-1">{insight.suggested_reply}</p>
                      </div>
                    </div>
                  )}

                  {/* Recovery Engine Block */}
                  {recovery && (
                    <div className={`rounded-lg p-4 border ${recovery.status === 'resolved' ? 'bg-success/5 border-success/20' : 'bg-warning/5 border-warning/30'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-semibold text-sm flex items-center gap-2 ${recovery.status === 'resolved' ? 'text-success' : 'text-warning'}`}>
                            {recovery.action_type === 'coupon_issued' ? <Ticket className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {recovery.action_type === 'coupon_issued' ? `Issued ${recovery.discount_value}% OFF Coupon` : 'Manual Recovery Required'}
                            {recovery.status === 'resolved' && <CheckCircle2 className="w-4 h-4 ml-2" />}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{recovery.manager_notes}</p>
                        </div>
                        {recovery.status !== 'resolved' && (
                          <Button size="sm" onClick={() => markResolved.mutate(recovery.id)} disabled={markResolved.isPending}>
                            Mark as Resolved
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
          </div>
        </div>

        {/* Right: Per-Item Ratings List (1/3 width) */}
        <div className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <span>🍽️</span> Menu Item Ratings
              </CardTitle>
              <CardDescription>
                Average customer rating aggregated by menu items ordered.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 max-h-[600px] relative overflow-y-auto space-y-4">
              {itemRatings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No menu item ratings computed yet. Place orders and submit ratings to view statistics.
                </div>
              ) : (
                itemRatings.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-sm text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.count} order{item.count > 1 ? 's' : ''} rated
                      </p>
                    </div>
                    <div className="flex flex-col items-end shrink-0 gap-1">
                      <span className="text-sm font-bold text-amber-500 flex items-center gap-0.5 leading-none">
                        ★ {item.avgRating.toFixed(1)}
                      </span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${
                              star <= Math.round(item.avgRating)
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-zinc-200 dark:text-zinc-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
