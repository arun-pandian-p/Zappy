
# Visual Preview + Menu UX Upgrade

## Overview

This upgrade adds a branded live website preview to the Admin and Super Admin dashboards, introduces a sliding food offers system, compacts the dashboard KPI cards, adds admin avatar customization, and improves the customer menu with a compact grid card option. All changes sync in real-time via the existing realtime infrastructure.

---

## Phase 1: Database Migration -- Offers Table

Create a new `offers` table for the sliding offers system:

```text
offers
- id (uuid, PK)
- restaurant_id (uuid, FK -> restaurants)
- title (text)
- description (text, nullable)
- image_url (text, nullable)
- discount_text (text, nullable) -- e.g. "20% OFF", "Buy 1 Get 1"
- linked_menu_item_id (uuid, FK -> menu_items, nullable)
- start_date (timestamptz)
- end_date (timestamptz)
- is_active (boolean, default true)
- sort_order (int, default 0)
- created_at / updated_at
```

RLS: restaurant staff can CRUD their own offers; anonymous users can SELECT active offers for a given restaurant.

Enable realtime on the offers table.

---

## Phase 2: Admin Dashboard -- Enhanced Website Preview

### Redesigned Preview Tab

Replace the current simple iframe preview with a device-frame preview panel:

- **Device selector buttons**: Mobile (375x812 phone frame), Tablet (768x1024), Desktop (full width)
- **Refresh button**: Reloads the iframe by toggling a key
- **Open in New Tab link**: Existing functionality preserved
- The iframe is wrapped in a centered device frame container that visually represents the selected device

File: **`src/pages/AdminDashboard.tsx`** -- update the `preview` tab rendering (lines 903-933)

### Compact KPI Cards (Dashboard Stats)

Reduce the stat card height by ~30% and make them denser:

File: **`src/components/analytics/DashboardStats.tsx`**
- Reduce padding from `p-6` to `p-4`
- Reduce value font from `text-3xl` to `text-2xl`
- Reduce icon container from `w-12 h-12` to `w-10 h-10`
- Add a subtle inline micro sparkline (tiny inline SVG/CSS bar) under the value

---

## Phase 3: Super Admin -- Tenant Preview Grid

### New Component: `TenantPreviewCard`

File: **`src/components/superadmin/TenantPreviewCard.tsx`** (new)

A visual card for each tenant showing:
- Restaurant logo (from `logo_url`) or fallback initial
- Restaurant name with theme color accent border
- Primary color swatch dot
- Active orders count badge
- Subscription tier badge
- Action buttons: "Open Admin", "View QR", "Suspend", "Edit"

### Update Super Admin Dashboard

File: **`src/pages/SuperAdminDashboard.tsx`**
- Add a new "preview" sub-view option in the restaurants tab
- Toggle between current table view and new grid card view
- Grid: 2 cols on tablet, 3 cols on desktop

---

## Phase 4: Sliding Food Offers System

### New Hook: `useOffers`

File: **`src/hooks/useOffers.ts`** (new)

CRUD operations for the `offers` table:
- `useOffers(restaurantId)` -- fetch active offers
- `useCreateOffer()` / `useUpdateOffer()` / `useDeleteOffer()`

### New Component: Offers Slider (Customer)

File: **`src/components/menu/OffersSlider.tsx`** (new)

- Horizontal auto-scrolling carousel using `embla-carousel-react` (already installed)
- Shows offer cards with image, title, discount badge
- Click navigates to linked menu item (scrolls to it)
- Auto-play with 4s interval, pausable on touch
- Swipe-enabled, infinite loop

### New Component: Offers Manager (Admin)

File: **`src/components/admin/OffersManager.tsx`** (new)

Admin CRUD for offers:
- List of current offers with toggle active/inactive
- Add offer form: title, description, image upload, discount text, link to menu item, date range
- Delete offer

### Integration Points

- **`src/pages/CustomerMenu.tsx`**: Add `OffersSlider` below the `CustomerTopBar` in both Home and Menu views (only when offers exist)
- **`src/pages/AdminDashboard.tsx`**: Add "Offers" tab to the sidebar and tab navigation, rendering `OffersManager`

---

## Phase 5: Admin Avatar Customization

### Update Admin Sidebar

File: **`src/components/admin/AdminSidebar.tsx`**
- Replace hardcoded DiceBear URL with dynamic avatar from user profile or restaurant settings
- Read avatar config from `restaurants.settings.admin_avatar` (JSONB): `{ type: "upload" | "emoji" | "mascot", value: string }`
- Fallback to current DiceBear default

### Update Settings Panel

File: **`src/components/admin/SettingsPanel.tsx`**
- Add a new "Profile" card section with:
  - Avatar preview (current avatar displayed)
  - Upload image button (uses existing `menu-images` storage bucket)
  - Emoji picker (preset grid of 12 emojis)
  - Display name input
  - Save updates to `restaurants.settings.admin_avatar`

### Update Admin Header

File: **`src/components/admin/AdminHeader.tsx`**
- Read the same avatar config and display it in the header avatar

---

## Phase 6: Customer Menu -- Compact Grid Cards

### Update FoodCard Component

File: **`src/components/menu/FoodCard.tsx`**
- Reduce the aspect ratio from `4/3` to `1/1` (square, smaller)
- Reduce padding from `p-4` to `p-3`
- Truncate description to 1 line
- Smaller font sizes throughout
- This makes cards compact enough for a 2-col mobile / 3-col tablet / 4-col desktop grid

### Add Grid View Toggle to Customer Menu

File: **`src/pages/CustomerMenu.tsx`** (in `renderMenu`)
- Add a view toggle (list vs grid) above the menu items
- List view: current `MenuItemRow` components
- Grid view: `FoodCard` in a responsive grid (`grid-cols-2 md:grid-cols-3 lg:grid-cols-4`)
- Default to list view on mobile, grid on tablet+

---

## Phase 7: Real-time Sync

### Enable Realtime on Offers Table

Migration SQL will include:
```text
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;
```

### Preview Sync

The admin preview iframe already loads the live customer menu page. When admin changes logo/theme/menu/offers:
1. Mutation updates DB
2. Realtime event fires
3. Customer menu hooks (`useMenuItems`, `useRestaurant`, `useOffers`) auto-invalidate via `react-query`
4. Preview iframe reflects changes (natural page re-render)

No additional sync engine needed -- the existing architecture handles this.

---

## Files Summary

### New Files
1. `src/hooks/useOffers.ts` -- CRUD hook for offers table
2. `src/components/menu/OffersSlider.tsx` -- Customer-facing offer carousel
3. `src/components/admin/OffersManager.tsx` -- Admin offer management UI
4. `src/components/superadmin/TenantPreviewCard.tsx` -- Visual tenant card for Super Admin

### Modified Files
1. `src/pages/AdminDashboard.tsx` -- Enhanced preview tab with device frames, add Offers tab
2. `src/components/analytics/DashboardStats.tsx` -- Compact KPI cards (reduced padding/sizes)
3. `src/pages/SuperAdminDashboard.tsx` -- Add grid view toggle for tenant cards
4. `src/components/superadmin/TenantTable.tsx` -- Minor: expose grid/table toggle
5. `src/components/menu/FoodCard.tsx` -- Compact card sizing
6. `src/pages/CustomerMenu.tsx` -- Add offers slider, grid/list toggle
7. `src/components/admin/AdminSidebar.tsx` -- Dynamic avatar, add Offers nav item
8. `src/components/admin/AdminHeader.tsx` -- Dynamic avatar from settings
9. `src/components/admin/SettingsPanel.tsx` -- Avatar customization section

### Database Migration
1. Create `offers` table with RLS policies
2. Enable realtime on `offers`

---

## Implementation Order

1. Database migration: create `offers` table + RLS + realtime
2. Create `useOffers` hook
3. Compact DashboardStats cards
4. Enhanced admin preview tab with device frames
5. Create OffersSlider component
6. Create OffersManager component
7. Integrate offers into AdminDashboard (new tab) and CustomerMenu
8. Create TenantPreviewCard and update SuperAdminDashboard grid view
9. Add avatar customization to SettingsPanel + AdminSidebar + AdminHeader
10. Add grid/list toggle to CustomerMenu with compact FoodCard
