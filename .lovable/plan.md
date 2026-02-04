
# Fix Admin Dashboard and Create Seed Data

## Problem Summary

The Admin Dashboard shows limited data and Settings show empty fields because:
1. **No restaurant data exists in the database** - All tables are empty
2. **DEMO_RESTAURANT_ID is hardcoded** to a UUID that doesn't exist
3. **Kitchen/Billing dashboards check for restaurantId** and show "No Restaurant Selected" when empty

The sidebar already has all 9 required routes (Dashboard, Menu, Tables & QR, Orders, Kitchen, Billing, Ads, Reviews, Settings) - this is confirmed in the code.

## Solution Overview

### Phase 1: Create Demo Restaurant Seed Data (Database Migration)

Insert a complete demo restaurant with:
- **Restaurant**: "QR Dine Pro Demo" with proper settings
- **Categories**: 7 categories (Starters, Burgers, Pizza, Main Course, Sides, Desserts, Beverages)
- **Menu Items**: 12 items with real images
- **Tables**: 8 tables (T1-T8)
- **Sample Orders**: 3 orders in different statuses
- **Sample Ad**: 1 active promotional ad

### Phase 2: Update AdminDashboard

Modify `AdminDashboard.tsx` to:
1. Fetch the first available restaurant from database if no ID provided
2. Use live Supabase data instead of mockData for menu items and tables
3. Pass the real restaurant ID to all child components

### Phase 3: Update Kitchen & Billing Dashboards

Modify both dashboards to:
1. Use the same restaurant auto-detection pattern
2. Remove dependency on environment variable
3. Show loading state while fetching restaurant

## Technical Implementation

### Database Migration SQL

```text
INSERT demo restaurant with ID: 00000000-0000-0000-0000-000000000001
  - name: "QR Dine Pro Demo"
  - slug: "demo"
  - currency: "INR"
  - tax_rate: 5%
  - service_charge_rate: 0%
  
INSERT 7 categories linked to restaurant

INSERT 12 menu items with Unsplash images

INSERT 8 tables (T1-T8, capacity 2-8)

INSERT sample orders with items
```

### File Changes

| File | Changes |
|------|---------|
| `src/pages/AdminDashboard.tsx` | Add `useRestaurants` hook to auto-select first restaurant, replace mockData with live data |
| `src/pages/KitchenDashboard.tsx` | Add restaurant auto-detection when no ID provided |
| `src/pages/BillingCounter.tsx` | Add restaurant auto-detection when no ID provided |
| `src/data/mockData.ts` | Keep as fallback/types only |

### Component Flow After Fix

```text
User visits /admin
       ↓
AdminDashboard loads
       ↓
useRestaurants() fetches all restaurants
       ↓
Auto-selects first restaurant (Demo)
       ↓
All child components receive restaurantId
       ↓
Live data displays correctly
```

## Expected Results

After implementation:
- Admin Dashboard shows live stats from database
- Settings panel loads restaurant data correctly
- Menu tab shows items from database
- Tables tab shows tables from database
- Kitchen/Billing tabs work without URL parameters
- All CRUD operations persist to database
- QR codes generate with correct restaurant ID

## Files to Create/Modify

1. **Migration file** - Seed demo restaurant and related data
2. **AdminDashboard.tsx** - Use live restaurant data
3. **KitchenDashboard.tsx** - Auto-detect restaurant
4. **BillingCounter.tsx** - Auto-detect restaurant
5. **CustomerMenu.tsx** - Auto-detect restaurant for testing
