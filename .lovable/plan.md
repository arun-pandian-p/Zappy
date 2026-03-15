# Fix Admin Promotions Tab (Blank Content)

## Problem

The sidebar nav item uses value `"promotions"` but the dashboard content checks `activeTab === "offers"`. When admin clicks "Promotions", `activeTab` becomes `"promotions"` but no content block matches, so the page is blank.

## Fix

### 1. `src/pages/AdminDashboard.tsx`

- Change `activeTab === "offers"` (line ~908) to `activeTab === "promotions"`
- Update the `mainTabs` array entry from `{ value: "offers", label: "Offers", icon: Gift }` to `{ value: "promotions", label: "Promotions", icon: Megaphone }` so the top tab bar matches the sidebar
- This single rename fix will make the Promotions tab render `OffersManager` + `PlatformAdsReadOnly` correctly

### 2. Feature gate key alignment

The feature gate already has `"promotions": "pro"` — so the lock check on the sidebar and top tabs will work correctly once the value is unified to `"promotions"`.

No database changes needed. Single file edit.

3. add be super-admin tab promotion tab also 
4. &nbsp;