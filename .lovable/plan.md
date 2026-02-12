

# Fix: Admin Preview Sync, Logo, Offers, and Compact Cards

## Issues Identified

1. **Admin preview iframe not syncing** -- The iframe loads once and doesn't refresh when admin makes changes (logo, theme, offers, menu edits)
2. **Logo/animated name mismatch** -- The admin header and customer top bar may show different branding because they read settings independently with no realtime refresh trigger
3. **Offers not appearing in customer menu** -- The `useActiveOffers` hook filters by date range but the offers slider only shows if data loads successfully; the admin preview iframe doesn't reload when new offers are added
4. **Food cards too large on mobile** -- The grid cards still use `aspect-square` which is too tall; need much smaller compact cards for mobile

---

## Fix 1: Auto-Refresh Admin Preview on Data Changes

**File: `src/pages/AdminDashboard.tsx`**

- Pass a `refreshKey` to `PreviewTabContent` that increments whenever the admin saves any change (menu item, offer, settings, logo)
- Add a `useEffect` that listens to query invalidation events on key queries (`menuItems`, `offers`, `restaurant`) and bumps the refresh key
- Simpler approach: add a `postMessage` listener or just auto-refresh the iframe every time the admin switches to the preview tab

**Implementation:**
- Track `activeTab` changes -- when switching to "preview", bump the refresh key
- Also bump refresh key after any successful mutation (menu add/delete, offer create, settings save)

---

## Fix 2: Consistent Logo and Branding in Customer TopBar

**File: `src/components/menu/CustomerTopBar.tsx`**

- The logo is already passed via `logoUrl={restaurant?.logo_url}` -- this should work
- Ensure the `AnimatedHotelName` component receives the same branding config as the admin
- The issue may be that the iframe preview loads without realtime subscription -- add `refetchInterval: 30000` to `useRestaurant` in customer menu to pick up changes faster

**File: `src/pages/CustomerMenu.tsx`**

- Add a Supabase realtime subscription on the `restaurants` table for the current restaurant ID
- When a change event fires, invalidate the `restaurant` query to refresh branding/logo instantly

---

## Fix 3: Offers Sync with Realtime

**File: `src/pages/CustomerMenu.tsx`**

- Add a Supabase realtime subscription on the `offers` table filtered by `restaurant_id`
- On any INSERT/UPDATE/DELETE event, invalidate the `offers` query
- This ensures the preview iframe and the live customer page both update when admin adds/edits offers

---

## Fix 4: Smaller Compact Food Cards for Mobile

**File: `src/components/menu/FoodCard.tsx`**

Current card uses `aspect-square` for the image which makes it very tall on mobile. Changes:
- Reduce image aspect ratio to `aspect-[4/3]` or even `aspect-[3/2]` 
- Reduce overall card padding from `p-3` to `p-2`
- Reduce font sizes: name to `text-xs`, price to `text-xs`
- Make the Add button smaller: `h-6 text-[10px]`
- Remove description entirely on compact cards to save space

**File: `src/pages/CustomerMenu.tsx`**

- Default `menuViewMode` to `'grid'` instead of `'list'` for a more modern look
- Reduce grid gap from `gap-3` to `gap-2` on mobile

---

## Fix 5: Realtime Subscriptions Setup

**File: `src/pages/CustomerMenu.tsx`** -- add useEffect with realtime channels:

```text
Channel 1: restaurants table (filter: id = restaurantId)
  -> invalidate ['restaurant', restaurantId]

Channel 2: offers table (filter: restaurant_id = restaurantId)  
  -> invalidate ['offers', restaurantId]

Channel 3: menu_items table (filter: restaurant_id = restaurantId)
  -> invalidate ['menuItems', restaurantId]
```

This ensures the customer menu (and the admin preview iframe showing it) auto-refreshes on any backend change.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/AdminDashboard.tsx` | Auto-refresh preview iframe on tab switch and after mutations |
| `src/pages/CustomerMenu.tsx` | Add realtime subscriptions for restaurants, offers, menu_items; default to grid view |
| `src/components/menu/FoodCard.tsx` | Reduce card size: smaller image ratio, tighter padding, smaller fonts |
| `src/components/menu/OffersSlider.tsx` | Minor: ensure graceful empty state |

---

## Technical Details

### Realtime subscription pattern (CustomerMenu.tsx):
- Use `supabase.channel()` with `postgres_changes` event
- Filter by `restaurant_id` using the Supabase filter syntax
- On payload received, call `queryClient.invalidateQueries()` for the relevant query key
- Clean up channel on component unmount

### FoodCard compact sizing:
- Image: `aspect-[3/2]` (from `aspect-square`)
- Card content padding: `p-2` (from `p-3`)
- Name font: `text-xs font-semibold` (from `text-sm font-bold`)
- Price: `text-xs` (from `text-sm`)
- Add button: `h-6 px-2 text-[10px]` (from `h-7 px-3 text-xs`)
- No description text on grid cards

### Preview auto-refresh:
- Increment `refreshKey` state in AdminDashboard whenever `activeTab` changes to "preview"
- Pass this key down to `PreviewTabContent` which uses it as the iframe `key`

