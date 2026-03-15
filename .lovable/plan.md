

# Platform Ads & Promotions System — Phased Plan

This is a large system. I'll scope it into a practical Phase 1 that builds on existing infrastructure (the `ads` table, `PlatformAdsManager`, `AdsPopup`, and `offers` table already exist), with clear hooks for future expansion.

## Phase 1 Scope (This Implementation)

### 1. Expand `ads` table with campaign fields
Add columns to the existing `ads` table via migration:
- `campaign_type` (text): `platform_promotion`, `brand_advertisement`, `restaurant_promotion`, `seasonal_campaign`, `festival_offer`
- `placement_type` (text): `header_banner`, `category_divider`, `popup_offer`, `footer_banner`
- `cta_text` (text): e.g. "Order Now", "Claim Offer"
- `priority` (integer, default 0)
- `advertiser_name` (text)
- `target_restaurants` (uuid[] — null = all restaurants)
- `budget` (numeric, nullable)
- `revenue_model` (text): `cpm`, `cpc`, `flat_fee`

No new tables needed — extend existing `ads` table.

### 2. Rebuild `PlatformAdsManager` as a tabbed module
Replace the current simple table with a full module in the Super Admin dashboard:

**Sub-tabs:**
- **Campaign Manager** — List/create/edit campaigns with all new fields (campaign type, advertiser, budget, dates, target restaurants, priority)
- **Ad Creatives** — Grid view of ad cards with image upload (using existing `menu-images` bucket), CTA text, placement type selector
- **Ad Placements** — Visual preview of where ads appear (header, category divider, popup, footer) with toggle controls
- **Analytics** — Impressions, clicks, CTR, revenue breakdown per ad/campaign (reads from existing `impressions`/`clicks` columns)

### 3. Update Customer Menu to render ads by placement
Modify `CustomerMenu.tsx` to fetch platform ads filtered by `placement_type` and `target_restaurants`:
- **Header Banner**: Show one active `header_banner` ad above categories
- **Category Divider**: Insert one ad card between every N categories
- **Popup Offer**: Keep existing `AdsPopup` behavior
- **Footer Banner**: Show a promo strip above the bottom nav

Respect max rules: 1 banner, 1 divider, 1 popup per session.

### 4. Restaurant Admin view (read-only)
In the existing Admin dashboard Promotions tab, add a read-only "Platform Ads" section showing which platform ads appear in their menu. No edit capability.

### 5. RLS updates
- Existing RLS already allows super_admin full access and public read for active ads
- Add filter logic in the `useActiveAds` hook to respect `target_restaurants` (filter client-side or add to query)

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| Migrate | DB migration | Add new columns to `ads` table |
| Rewrite | `src/components/superadmin/PlatformAdsManager.tsx` | Full tabbed campaign manager |
| Create | `src/components/superadmin/CampaignForm.tsx` | Create/edit campaign form |
| Create | `src/components/superadmin/AdAnalyticsPanel.tsx` | Analytics dashboard for ads |
| Create | `src/components/menu/HeaderBannerAd.tsx` | Header banner ad component |
| Create | `src/components/menu/CategoryDividerAd.tsx` | Between-category ad card |
| Create | `src/components/menu/FooterPromoAd.tsx` | Footer promo strip |
| Modify | `src/hooks/useAds.ts` | Add placement/target filtering hooks |
| Modify | `src/pages/CustomerMenu.tsx` | Integrate placement-based ad rendering |
| Modify | `src/pages/AdminDashboard.tsx` | Add read-only platform ads view in Promotions |

## Future Phases (Not Built Now)
- AI-based ad targeting
- Geo/time-based campaigns
- Video ad support
- Revenue settlement system
- Restaurant self-service promotion requests

