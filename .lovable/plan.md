

# Fix: Feature Gate Not Blocking Access When Disabled

## Problem
Two issues with the feature gate system:

1. **"promotions" bypasses ads_enabled toggle** — The `isLocked` function only checks the `adsToggle` for features `"ads"` and `"offers"`, but NOT `"promotions"`. So even when `ads_enabled` is `false` on a restaurant, the Promotions tab remains accessible.

2. **"inventory" not gated at all** — The sidebar has an "Inventory" nav item (`value: "inventory"`), but `"inventory"` is missing from `FeatureKey` and `FEATURE_TIERS`. When `isLocked("inventory")` runs, it gets `undefined` for the required tier and returns `null` (unlocked).

## Fix

### `src/hooks/useFeatureGate.ts`
- Add `"inventory"` to the `FeatureKey` union type
- Add `"inventory": "pro"` to `FEATURE_TIERS`
- Extend the ads toggle check to also cover `"promotions"`:
  ```
  if ((feature === "ads" || feature === "offers" || feature === "promotions") && !adsToggle)
  ```
  This ensures that when `ads_enabled` is off, the Promotions tab is also locked with the "ads_toggle" reason.

Single file change. No database modifications needed.

