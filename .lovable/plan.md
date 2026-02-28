

# Add Open-in-New-Window Buttons for Kitchen & Billing in Admin Dashboard

## What This Does

When you're on the Admin dashboard and click the Kitchen or Billing tab, you'll see small "Open in new window" and "Refresh" buttons (like in your screenshot) that let you pop out Kitchen or Billing into their own full-screen browser tab. This is useful for running Kitchen Display on a separate screen.

## Changes

### 1. Update Kitchen & Billing Embedded Tabs in AdminDashboard

Add a small toolbar at the top of the Kitchen and Billing tab content with:
- **Open in new window** button (arrow icon) -- opens `/kitchen?r={restaurantId}` or `/billing?r={restaurantId}` in a new browser tab
- **Refresh** button (rotate icon) -- re-renders the embedded component

This matches the 2nd screenshot you shared (the arrow + refresh icons).

### 2. Hide Header When Embedded

Update `KitchenDashboard` and `BillingCounter` to hide their standalone headers (back button, logout, title bar) when `embedded={true}`, since the admin dashboard already provides those.

### 3. Ensure Tenant Data Isolation

The system already isolates data per restaurant via `restaurant_id` on all queries and RLS policies. Each staff member's `user_roles` record links them to their specific `restaurant_id`, so:
- Kitchen staff at Restaurant A only sees Restaurant A's orders
- Billing staff at Restaurant B only sees Restaurant B's invoices
- Admin sees only their own restaurant's data

No database changes are needed -- this is already working.

## Technical Details

### File: `src/pages/AdminDashboard.tsx`
- Add a floating toolbar with "Open in new tab" and "Refresh" buttons above the embedded Kitchen and Billing components
- Track a refresh key per embedded component

### File: `src/pages/KitchenDashboard.tsx`
- When `embedded={true}`, skip rendering the `<header>` and waiter calls alert bar (the parent admin dashboard provides navigation)

### File: `src/pages/BillingCounter.tsx`
- When `embedded={true}`, skip rendering the standalone header/back button

### No database or edge function changes needed
All tenant isolation is already enforced by existing RLS policies using `restaurant_id`.

