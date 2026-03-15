

# Fix Super Admin: Separate "Platform Ads" and "Promotions"

## Problem
Both "Platform Ads" and "Promotions" sidebar items render the same `PlatformAdsManager`. The user wants them to be distinct:
- **Platform Ads** → keeps current `PlatformAdsManager` (campaign CRUD for ads shown on tenant menus)
- **Promotions** → new view showing **restaurant-wise cards** with each restaurant's ad/promotion status (ads enabled or not, active offers count), with ability to toggle ads per restaurant

## Changes

### 1. Create `src/components/superadmin/PromotionsOverview.tsx`
A new component that:
- Fetches all restaurants via `useRestaurants()`
- Fetches all offers grouped by restaurant
- Renders a **card grid** (one card per restaurant) showing:
  - Restaurant name, logo, subscription tier
  - "Ads Enabled" toggle (With Ads / Ad-Free badge)
  - Count of active offers/promotions running
  - Status indicator (green = promotions running, gray = none)
- Toggle calls `useUpdateRestaurant` to flip `ads_enabled`

### 2. Modify `src/pages/SuperAdminDashboard.tsx`
- Import `PromotionsOverview`
- Change `case 'promotions'` to render `<PromotionsOverview />` instead of `<PlatformAdsManager />`
- Update page title description to "View restaurant-wise promotion & ad status"

### 3. No sidebar changes needed
Both "Platform Ads" and "Promotions" already exist as separate sidebar items — just need different content.

