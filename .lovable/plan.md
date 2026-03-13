

# Fix Multi-Tenant Staff Data Isolation

## Problem
1. **Super Admin sees all staff details** -- When super admin opens "Users", it shows kitchen/waiter/billing staff from all restaurants. Super admin should only see restaurant admin accounts, not sub-staff.
2. **Kitchen/Waiter/Billing dashboards have demo fallback** -- When auth state fails, dashboards fall back to `DEMO_RESTAURANT_ID`, potentially leaking data across tenants.
3. **No per-restaurant scoping in Super Admin user view** -- Staff are shown in a flat list with no restaurant grouping.

## Changes

### 1. Super Admin Users tab -- show only admins
**File: `src/pages/SuperAdminDashboard.tsx`**
- Instead of rendering `<UserManagement />` (which shows all staff), render a new **AdminAccountsTable** that only shows `restaurant_admin` users with their restaurant name.
- Super admin sees: admin email, name, restaurant name, status. No sub-staff details.

### 2. New component: `AdminAccountsTable`
**Create: `src/components/superadmin/AdminAccountsTable.tsx`**
- Query `user_roles` filtered to `role = 'restaurant_admin'`, join with `staff_profiles` for name/email and `restaurants` for restaurant name.
- Display a simple table: Name, Email, Restaurant, Status.
- No ability to see kitchen/waiter/billing staff from here.

### 3. Remove demo restaurant fallback from operational dashboards
**Files: `src/pages/KitchenDashboard.tsx`, `src/pages/WaiterDashboard.tsx`, `src/pages/BillingCounter.tsx`**
- Remove `DEMO_RESTAURANT_ID` fallback.
- If `restaurantId` is not available from auth or props, show an error/redirect instead of falling back to a hardcoded ID.
- This ensures kitchen staff from Restaurant A can never accidentally see Restaurant B's data.

### 4. Restaurant Admin Users tab -- already scoped (no change needed)
The existing `UserManagement` component already filters by `effectiveRestaurantId` for restaurant admins, so Admin1 only sees their own staff. This is correct and unchanged.

## Data Flow Summary

```text
Super Admin → Users tab → sees only restaurant_admin accounts (name + email + restaurant)
                          ↳ does NOT see kitchen/waiter/billing staff

Admin1 → Users tab → sees only their own restaurant's staff (kitchen, waiter, billing)
Admin2 → Users tab → sees only their own restaurant's staff

Kitchen1 (under Admin1) → sees only Admin1's restaurant orders
Kitchen2 (under Admin2) → sees only Admin2's restaurant orders
```

## Files
- **Create**: `src/components/superadmin/AdminAccountsTable.tsx`
- **Modify**: `src/pages/SuperAdminDashboard.tsx` -- swap `UserManagement` for `AdminAccountsTable`
- **Modify**: `src/pages/KitchenDashboard.tsx` -- remove demo fallback
- **Modify**: `src/pages/WaiterDashboard.tsx` -- remove demo fallback
- **Modify**: `src/pages/BillingCounter.tsx` -- remove demo fallback

