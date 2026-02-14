

# Feature Gating + Ads Control System

## Overview

Implement a dual-layer feature gating system where SaaS modules unlock based on subscription plan (free/pro/enterprise), and Ads specifically requires both plan eligibility AND a tenant-level toggle. Branding animations and multi-outlet remain Business-exclusive.

---

## 1. Feature Gate Hook

**New File**: `src/hooks/useFeatureGate.ts`

Create a central hook that reads the restaurant's `subscription_tier` and `ads_enabled` from the already-loaded restaurant data and returns:

- `canAccess(feature)` -- boolean check
- `isLocked(feature)` -- returns lock reason (plan upgrade needed, ads toggle needed, or null)
- Feature matrix constants mapping each module to its required tier

Feature matrix:

| Module | Free | Pro | Business |
|--------|------|-----|----------|
| QR Ordering, Menu, Orders, Kitchen, Basic Billing | Yes | Yes | Yes |
| Advanced Billing, Re-Billing, Analytics Pro | No | Yes | Yes |
| Ads Manager | No | Pro+ AND ads_enabled | Business+ AND ads_enabled |
| Branding Animations | No | No | Yes |
| Multi-Outlet | No | No | Yes |

The hook uses the existing `restaurant.subscription_tier` and `restaurant.ads_enabled` columns -- no new database columns needed for the core gate.

---

## 2. Upgrade/Enable Modal Component

**New File**: `src/components/admin/FeatureLockedModal.tsx`

A reusable dialog that appears when a locked feature is clicked:

- Shows the feature name and what plan is required
- For Ads: shows either "Upgrade to Pro" or "Enable Ads in Settings" depending on which condition fails
- CTA buttons: "Upgrade Plan" (navigates to settings or contacts super admin) and "Enable in Settings" (navigates to settings tab)
- Glass-style card design consistent with the app

---

## 3. Admin Sidebar Lock States

**File**: `src/components/admin/AdminSidebar.tsx`

- Import `useFeatureGate` (pass restaurant data via props or context)
- Add `subscriptionTier` and `adsEnabled` props
- For locked items, show a lock icon next to the nav label
- On click of a locked item, instead of switching tabs, trigger the `FeatureLockedModal`
- Ads and Offers items show lock icon when plan is Free or ads_enabled is false

---

## 4. Admin Header Tab Bar Lock States

**File**: `src/pages/AdminDashboard.tsx`

- In the `mainTabs` array, add a `requiredTier` field to each tab definition
- Before switching tabs via `setActiveTab`, check `canAccess(tab.value)` 
- If locked, show `FeatureLockedModal` instead of switching
- Locked tabs show a small lock icon in the tab bar (matching the uploaded reference images)
- Pass `subscriptionTier` and `adsEnabled` down to AdminSidebar

---

## 5. Ads Tab Content Gating

**File**: `src/pages/AdminDashboard.tsx` (ads tab section)

- Wrap the existing `{activeTab === "ads"}` block with a feature gate check
- If the restaurant's plan allows ads but `ads_enabled` is false, show a settings prompt card instead of the full AdsManager
- If the plan doesn't allow ads at all, the tab is already locked by the sidebar/header gate

---

## 6. Branding Gate in Settings

**File**: `src/components/admin/SettingsPanel.tsx`

- The branding/animation settings section checks if plan is "enterprise"
- If not, show a locked overlay with "Business plan required" message
- This uses the same `useFeatureGate` hook

---

## Technical Details

### New Files

| File | Purpose |
|------|---------|
| `src/hooks/useFeatureGate.ts` | Central feature access logic based on subscription tier + ads_enabled |
| `src/components/admin/FeatureLockedModal.tsx` | Reusable upgrade/enable prompt dialog |

### Modified Files

| File | Changes |
|------|---------|
| `src/components/admin/AdminSidebar.tsx` | Add lock icons, gate click handlers, new props for tier/adsEnabled |
| `src/pages/AdminDashboard.tsx` | Pass tier props to sidebar, gate tab switching, lock icons in tab bar |
| `src/components/admin/SettingsPanel.tsx` | Lock branding section for non-Business plans |

### No Database Changes Required

The existing `restaurants.subscription_tier` (enum: free/pro/enterprise) and `restaurants.ads_enabled` (boolean, default true) columns already provide all the data needed. The feature gating is purely a frontend enforcement layer -- the backend RLS policies already restrict data access appropriately.

### Feature Gate Logic (Key Code Pattern)

```text
FEATURE_TIERS = {
  "menu": "free",
  "orders": "free",
  "kitchen": "free",
  "billing": "free",
  "coupons": "pro",
  "ads": "pro",         // + ads_enabled check
  "offers": "pro",
  "exports": "pro",
  "research": "pro",
  "branding": "enterprise",
  "multi-outlet": "enterprise"
}

canAccess(feature):
  requiredTier = FEATURE_TIERS[feature]
  tierRank = { free: 0, pro: 1, enterprise: 2 }
  
  if tierRank[currentTier] < tierRank[requiredTier]:
    return false
  
  if feature === "ads" && !ads_enabled:
    return false
  
  return true
```

### Props Flow

```text
AdminDashboard
  -- reads restaurant.subscription_tier, restaurant.ads_enabled
  -- passes to AdminSidebar as props
  -- uses useFeatureGate internally for tab gating
  -- renders FeatureLockedModal when locked tab clicked
```

