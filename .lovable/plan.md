

# Customer App Upgrade + Order Flow + Kitchen Sync + Billing POS

## Overview

This plan addresses the complete customer-to-kitchen-to-billing flow with fixes for the critical kitchen order update error, a redesigned customer menu UI inspired by the reference mockup, enhanced order tracking, and branding injection throughout.

## Critical Bug Fix: Kitchen "Failed to update order status"

**Root cause**: The RLS policy on the `orders` table for UPDATE checks `restaurant_id = get_user_restaurant_id(auth.uid())`. When the kitchen page is accessed by the same admin user who is logged in, this SHOULD work. However, the customer ordering flow creates orders WITHOUT authentication (anonymous/public access). The customer is NOT logged in -- they scan a QR and place orders. The INSERT policy allows "Anyone" but the UPDATE policy requires either:
- A logged-in user whose `get_user_restaurant_id(auth.uid())` matches, OR
- `auth.uid() IS NULL` AND `restaurant_id = demo UUID`

The admin IS logged in when using the kitchen, so this should work. The issue is likely that the kitchen dashboard is accessed from a browser where the user is NOT logged in (e.g., a kitchen tablet). The fix is to ensure kitchen/billing pages require authentication, or to update the RLS policy to also allow anon updates for any active restaurant (not just the demo one).

**Fix**: Update the orders UPDATE RLS policy to be more permissive for staff operations, while keeping it scoped to restaurant context.

---

## Phase 1: Database Fixes

### 1a. Fix Orders UPDATE RLS Policy
The current policy blocks kitchen staff if they're not logged in or if their restaurant_id doesn't match. Update to allow authenticated users with a matching restaurant_id to update orders.

### 1b. Enable Realtime (already done)
Orders, order_items, and waiter_calls already have realtime enabled -- confirmed.

---

## Phase 2: Customer Menu UI Redesign

Inspired by the reference mockup (Grand Palace Hotel design), redesign the CustomerMenu page:

### 2a. New Branded Top Bar (sticky)
- Left: Restaurant logo (rounded) + Restaurant name + Table badge (e.g., "Table #5")
- Right: Call waiter bell icon (with notification dot) + Cart icon (with count badge)
- Shrinks on scroll with blur backdrop
- Uses tenant branding colors

### 2b. Home View Enhancement
- Hero banner section with restaurant banner image
- Offers/promo carousel (if ads enabled)
- Quick action cards (View Menu, Call Waiter)
- Active order status card with live timer

### 2c. Menu View Redesign
- Category horizontal scroll tabs with active highlight (sticky below header)
- Category banner image (first item's image or category image)
- List-style food cards (matching reference): thumbnail left, name/rating/prep time center, price + add/stepper right
- Search bar at top
- Floating "View Cart" bar at bottom when items in cart: shows count + total + "View Cart" button

### 2d. Cart View Upgrade
- Slide-up drawer or full page
- Each item: thumbnail, name, veg/non-veg badge, rating, prep time, price, quantity stepper
- Special instructions text input per item
- Order summary: subtotal, tax, service charge, total
- "Place Order" prominent CTA button

### 2e. Orders View with Status Pipeline
- Status progress bar: Placed -> Accepted -> Preparing -> Ready -> Served
- Timer elapsed since order placement
- Estimated wait time
- Order summary with items
- Reorder button for completed orders

### 2f. Bottom Navigation Update
- 5 tabs: Home, Menu, Cart, Orders, Profile (matching reference)
- Center floating "Call Waiter" bell button (elevated, themed)
- Cart badge count
- Active order status dot on Orders tab

---

## Phase 3: Kitchen Dashboard Fixes

### 3a. Fix order status update
- Ensure kitchen page checks for auth and passes the correct restaurant context
- The kitchen uses `useKitchenOrderActions` which calls `useUpdateOrderStatus` -- this does a simple `.update({ status })` filtered by order `id`. The RLS policy then validates restaurant ownership.
- Fix: either ensure kitchen users are always authenticated, or update the RLS policy

### 3b. Add "Served" column
- Currently: Pending | Preparing | Ready
- Add a 4th column: Served (for waiter confirmation)
- Ready orders get a "Mark Served" button

### 3c. Enhanced Kitchen Card
- Show food item images (small thumbnails)
- Show prep timer (elapsed since "preparing" started)
- Highlight urgent orders (>10 min in pending)

---

## Phase 4: Billing POS Enhancements

### 4a. Table Selector
- Grid of table buttons showing status (available/occupied/billing)
- Click to load that table's active order

### 4b. Receipt with Branding
- Include restaurant logo, name, address on thermal receipt
- QR code for feedback page at bottom

---

## Phase 5: Branding Injection

Apply tenant branding (from `restaurants` table) across all customer-facing views:
- Top bar: logo + name + theme colors
- Bottom nav: active tab color uses tenant primary
- Buttons: "Add to Cart", "Place Order" use tenant primary
- Category tabs: active state uses tenant primary
- Progress bars: tenant primary color
- Receipt header: logo + name

CSS variables approach:
```text
--tenant-primary: restaurants.primary_color
--tenant-secondary: restaurants.secondary_color  
--tenant-font: restaurants.font_family
```

---

## Files to Create

1. `src/components/menu/CustomerTopBar.tsx` -- Branded sticky header with logo, name, table badge, waiter bell, cart icon
2. `src/components/menu/FloatingCartBar.tsx` -- Bottom floating bar showing cart count + total + "View Cart" CTA
3. `src/components/menu/OrderStatusPipeline.tsx` -- Visual status progress bar component
4. `src/components/menu/MenuItemRow.tsx` -- List-style food card (compact, horizontal layout matching reference)

## Files to Modify

1. `src/pages/CustomerMenu.tsx` -- Major redesign: new top bar, redesigned views, floating cart bar, branding injection, 5-tab bottom nav
2. `src/components/menu/BottomNav.tsx` -- Add Profile tab, center Call Waiter button, branding colors
3. `src/components/menu/FoodCard.tsx` -- Update styling for grid view option
4. `src/pages/KitchenDashboard.tsx` -- Fix auth context, add Served column, enhance cards
5. `src/pages/BillingCounter.tsx` -- Add table selector grid
6. `src/components/order/WaitingTimer.tsx` -- Enhance with status pipeline visualization
7. `src/hooks/useOrders.ts` -- Add `started_preparing_at` and `ready_at` timestamp updates in kitchen actions

## Database Migrations

1. Update orders UPDATE RLS policy to properly handle authenticated restaurant staff

## Implementation Order

1. Fix kitchen order update RLS policy (unblocks kitchen workflow)
2. Update `useOrders.ts` kitchen actions to set timestamps (`started_preparing_at`, `ready_at`)
3. Create new customer menu components (TopBar, FloatingCartBar, OrderStatusPipeline, MenuItemRow)
4. Redesign CustomerMenu.tsx with all new components and branding
5. Update BottomNav with 5 tabs and branding
6. Enhance KitchenDashboard with Served column and better cards
7. Update BillingCounter with table selector
8. Apply branding injection throughout

