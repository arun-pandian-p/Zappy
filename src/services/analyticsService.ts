import { supabase } from '@/integrations/supabase/client';

export type CampaignEventType = 
  | 'impression' 
  | 'click' 
  | 'add_to_cart' 
  | 'coupon_applied' 
  | 'checkout_started' 
  | 'order_completed'
  | 'redirect_opened'
  | 'category_opened'
  | 'carousel_swipe';

// Generate or retrieve a persistent session identifier for deduplication
const getSessionId = (): string => {
  if (typeof window === 'undefined') return 'server-session';
  let sid = sessionStorage.getItem('zappy_analytics_session');
  if (!sid) {
    sid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('zappy_analytics_session', sid);
  }
  return sid;
};

// In-memory sets to prevent click/impression spamming and refresh farming
const trackedImpressions = new Set<string>();
const clickThrottleMap = new Map<string, number>();

export const analyticsService = {
  /**
   * Tracks a live marketing campaign event in the database with strict deduplication
   */
  async trackEvent({
    campaignId,
    eventType,
    tenantId,
    metadata = {},
    revenueAmount = 0
  }: {
    campaignId: string;
    eventType: CampaignEventType;
    tenantId?: string | null;
    metadata?: Record<string, any>;
    revenueAmount?: number;
  }): Promise<void> {
    if (!campaignId) return;

    const sessionId = getSessionId();
    const dedupKey = `${campaignId}_${eventType}`;

    // Anti-Spam: Only allow ONE impression tracking call per slide/campaign per session
    if (eventType === 'impression') {
      if (trackedImpressions.has(dedupKey)) {
        return; // Skip duplicate impression
      }
      trackedImpressions.add(dedupKey);
    }

    // Anti-Spam: Throttle clicks on the same campaign within 1.5 seconds (prevents click farming)
    if (eventType === 'click') {
      const now = Date.now();
      const lastClick = clickThrottleMap.get(campaignId) || 0;
      if (now - lastClick < 1500) {
        return; // Throttled
      }
      clickThrottleMap.set(campaignId, now);
    }

    try {
      // Async database event recording
      const { error } = await supabase
        .from('campaign_events')
        .insert({
          campaign_id: campaignId,
          event_type: eventType,
          tenant_id: tenantId || null,
          session_id: sessionId,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
          },
          revenue_amount: revenueAmount
        });

      if (error) {
        console.warn('[Analytics Service] Failed to record event:', error.message);
      }
    } catch (e) {
      console.error('[Analytics Service] Error tracking event:', e);
    }
  },

  /**
   * Records a verified coupon redemption upon successful order checkout completion
   */
  async trackCouponRedemption({
    couponCode,
    campaignId,
    orderId,
    discountAmount = 0,
    orderTotal = 0,
    tenantId
  }: {
    couponCode: string;
    campaignId?: string | null;
    orderId: string;
    discountAmount?: number;
    orderTotal?: number;
    tenantId?: string | null;
  }): Promise<void> {
    if (!couponCode || !orderId) return;

    try {
      const { error } = await supabase
        .from('coupon_redemptions')
        .insert({
          coupon_code: couponCode,
          campaign_id: campaignId || null,
          order_id: orderId,
          discount_amount: discountAmount,
          order_total: orderTotal,
          tenant_id: tenantId || null
        });

      if (error) {
        console.warn('[Analytics Service] Failed to log coupon redemption:', error.message);
      }
    } catch (e) {
      console.error('[Analytics Service] Error logging coupon redemption:', e);
    }
  },

  /**
   * Resolves SQL live analytics reports from database campaign event tables
   */
  async getLiveAnalyticsReport(restaurantId: string, daysFilter = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysFilter);

    // Fetch all active ads first to map names
    const { data: ads } = await supabase
      .from('ads')
      .select('id, title, placement_type');

    const adMap = new Map(ads?.map(a => [a.id, a]) || []);

    // Query events
    const { data: events } = await supabase
      .from('campaign_events')
      .select('*')
      .gte('created_at', startDate.toISOString());

    // Query redemptions
    const { data: redemptions } = await supabase
      .from('coupon_redemptions')
      .select('*')
      .gte('created_at', startDate.toISOString());

    // Calculate aggregated metrics
    let impressionsCount = 0;
    let clicksCount = 0;
    let directRevenue = 0;
    const campaignMap: Record<string, { title: string; impressions: number; clicks: number; revenue: number }> = {};

    // Seed campaign map with active ads
    ads?.forEach(ad => {
      campaignMap[ad.id] = {
        title: ad.title,
        impressions: 0,
        clicks: 0,
        revenue: 0
      };
    });

    events?.forEach(ev => {
      const isImpression = ev.event_type === 'impression';
      const isClick = ev.event_type === 'click';

      if (isImpression) impressionsCount++;
      if (isClick) clicksCount++;

      if (ev.campaign_id) {
        if (!campaignMap[ev.campaign_id]) {
          campaignMap[ev.campaign_id] = {
            title: adMap.get(ev.campaign_id)?.title || `Promo Campaign ${ev.campaign_id.substring(0, 5)}`,
            impressions: 0,
            clicks: 0,
            revenue: 0
          };
        }

        const data = campaignMap[ev.campaign_id];
        if (isImpression) data.impressions++;
        if (isClick) data.clicks++;
      }
    });

    redemptions?.forEach(red => {
      directRevenue += Number(red.order_total) || 0;
      if (red.campaign_id && campaignMap[red.campaign_id]) {
        campaignMap[red.campaign_id].revenue += Number(red.order_total) || 0;
      }
    });

    // Populate overall coupon stats
    const couponBreakdown: Record<string, { code: string; redemptionsCount: number; savings: number; sales: number }> = {};
    redemptions?.forEach(red => {
      const code = red.coupon_code.toUpperCase();
      if (!couponBreakdown[code]) {
        couponBreakdown[code] = {
          code,
          redemptionsCount: 0,
          savings: 0,
          sales: 0
        };
      }
      const data = couponBreakdown[code];
      data.redemptionsCount++;
      data.savings += Number(red.discount_amount) || 0;
      data.sales += Number(red.order_total) || 0;
    });

    return {
      impressions: impressionsCount,
      clicks: clicksCount,
      ctr: impressionsCount > 0 ? ((clicksCount / impressionsCount) * 100).toFixed(1) : '0.0',
      revenue: directRevenue,
      redemptions: redemptions?.length || 0,
      campaignsList: Object.entries(campaignMap).map(([id, info]) => ({
        id,
        title: info.title,
        impressions: info.impressions,
        clicks: info.clicks,
        revenue: info.revenue,
        ctr: info.impressions > 0 ? ((info.clicks / info.impressions) * 100).toFixed(1) : '0.0'
      })).sort((a, b) => b.clicks - a.clicks),
      couponsList: Object.values(couponBreakdown).sort((a, b) => b.redemptionsCount - a.redemptionsCount)
    };
  }
};
