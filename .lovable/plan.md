

# Complete Staff Login Flow — Role-Based Dashboard Access

## Overview

Currently, the restaurant admin can already create staff accounts (kitchen, waiter, billing) via the Users tab. However, when staff log in, the dashboards don't properly enforce authentication or use the staff's assigned restaurant. This plan adds proper auth guards and ensures each staff role lands on their correct, restaurant-scoped dashboard.

## Current State (What Already Works)

- Unified login at `/login` with role-based redirect (kitchen_staff -> `/kitchen`, waiter_staff -> `/waiter`, billing_staff -> `/billing`)
- Admin can create staff via Users tab (calls `manage-staff` edge function)
- `useAuth` hook fetches role and `restaurant_id` from `user_roles` table
- Staff profiles stored in `staff_profiles` table

## What's Missing

1. Kitchen, Waiter, and Billing dashboards fall back to a demo restaurant ID instead of using the authenticated user's restaurant
2. No auth guards -- anyone can visit `/kitchen`, `/waiter`, `/billing` without logging in
3. No "wrong role" protection (e.g., a waiter accessing `/kitchen`)

## Implementation Plan

### 1. Create a reusable Auth Guard component

A new `src/components/auth/RoleGuard.tsx` component that:
- Shows a loading spinner while auth state resolves
- Redirects unauthenticated users to `/login`
- Checks if the user's role matches the allowed roles for that route
- Shows an "Access Denied" message or redirects if the role doesn't match
- Passes `restaurantId` down to the wrapped dashboard

### 2. Update Kitchen Dashboard (`src/pages/KitchenDashboard.tsx`)

- When not in `embedded` mode, use `useAuth()` to get `restaurantId` from the authenticated user's role
- Remove the demo restaurant ID fallback for authenticated access
- Keep the `embedded` and `?r=` query param modes for admin preview

### 3. Update Waiter Dashboard (`src/pages/WaiterDashboard.tsx`)

- Same pattern: prioritize `authRestaurantId` from `useAuth()`
- Remove demo fallback for standalone access

### 4. Update Billing Counter (`src/pages/BillingCounter.tsx`)

- Same pattern: prioritize `authRestaurantId` from `useAuth()`
- Remove demo fallback for standalone access

### 5. Wrap routes in App.tsx with RoleGuard

```text
/kitchen  ->  RoleGuard(allowedRoles: [kitchen_staff, restaurant_admin])
/waiter   ->  RoleGuard(allowedRoles: [waiter_staff, restaurant_admin])
/billing  ->  RoleGuard(allowedRoles: [billing_staff, restaurant_admin])
/admin    ->  RoleGuard(allowedRoles: [restaurant_admin])
/super-admin -> RoleGuard(allowedRoles: [super_admin])
```

Restaurant admins can access all staff dashboards (they manage them). Super admins bypass all guards.

### 6. Add logout button to staff dashboards

Each staff dashboard (Kitchen, Waiter, Billing) will get a small logout/back button in the header so staff can sign out and return to the login page.

## Complete User Flow

```text
1. Super Admin creates a restaurant via /super-admin (tenant provisioning)
2. Restaurant Admin logs in at /login -> redirected to /admin
3. Admin goes to Users tab -> creates staff accounts:
   - kitchen@restaurant.com (Kitchen Staff)
   - waiter@restaurant.com (Waiter Staff)  
   - billing@restaurant.com (Billing Staff)
4. Kitchen staff logs in at /login -> auto-redirected to /kitchen
   - Sees only their restaurant's orders
5. Waiter staff logs in at /login -> auto-redirected to /waiter
   - Sees only their restaurant's tables and calls
6. Billing staff logs in at /login -> auto-redirected to /billing
   - Sees only their restaurant's billing data
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/auth/RoleGuard.tsx` | Create -- reusable auth guard |
| `src/App.tsx` | Modify -- wrap staff/admin routes with RoleGuard |
| `src/pages/KitchenDashboard.tsx` | Modify -- use auth restaurant, add logout |
| `src/pages/WaiterDashboard.tsx` | Modify -- use auth restaurant, add logout |
| `src/pages/BillingCounter.tsx` | Modify -- use auth restaurant, add logout |

No database changes needed. All required tables, roles, and edge functions already exist.

