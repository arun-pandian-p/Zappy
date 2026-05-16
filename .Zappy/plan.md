

## Plan: Fix Customer Menu Promotions & Order Flow

### Problem Analysis

**Root Cause Identified**: All RLS policies on `offers`, `orders`, `order_items`, and `waiter_calls` contain `EXISTS (SELECT 1 FROM restaurants r WHERE r.id = ... AND r.is_active = true)` subqueries. But the `restaurants` table has NO anonymous SELECT policy — only authenticated staff/super admins can read it. This means **every EXISTS check silently returns false for anonymous (customer) users**, causing:

1. **Offers return 0 rows** for customers (confirmed: anon scan shows "Table 'offers' Row count: 0")
2. **Order INSERT fails** because the WITH CHECK condition can never pass for anon users
3. **Waiter calls fail** for the same reason

The user also wants external platform ads (Swiggy, Zomato, Dunzo, Coca-Cola) removed from the customer menu — only showing the restaurant's own promotional offers from the `offers` table.

---

### Step 1: Database Migration — Fix RLS Root Cause

Create a `SECURITY DEFINER` function that bypasses RLS to check restaurant active status:

```sql
CREATE OR REPLACE FUNCTION public.is_restaurant_active(_restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = _restaurant_id AND is_active = true
  )
$$;
```

Then update all affected RLS policies to use `is_restaurant_active(restaurant_id)` instead of the inline EXISTS subquery:

- **offers** SELECT policy (Public can view active offers)
- **orders** INSERT policy (Anyone can create orders)
- **order_items** INSERT policy (Anyone can create order items)
- **waiter_calls** INSERT policy (Anyone can create waiter calls)
- **waiter_calls** SELECT policies (Anon + Authenticated)
- **table_sessions** INSERT/SELECT policies
- **feedback** INSERT policy
- **customer_events** INSERT policy

This single function fix resolves all customer-facing failures at once.

### Step 2: Remove External Ads from Customer Menu

In `src/pages/CustomerMenu.tsx`:
- Remove `HeaderBannerAd`, `CategoryDividerAd`, `FooterPromoAd`, and `AdsPopup` components from the render
- Remove the `useAdsByPlacement`, `useRandomActiveAd`, `useTrackAdImpression`, `useTrackAdClick` hook calls
- Remove all ad-related state variables (`showAdPopup`, `adShown`, `headerAdDismissed`, etc.)
- Keep the `OffersSlider` (restaurant's own promotions) — this is what the user wants displayed

### Step 3: Verify End-to-End Order Flow

After the RLS fix:
- Customer scans QR → sees restaurant branding + offers slider
- Customer adds items → places order → order INSERT succeeds
- Kitchen dashboard shows the new order
- Kitchen marks order as preparing → ready → served
- Billing counter can process payment

---

### Technical Details

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Offers not showing | `EXISTS(restaurants)` fails for anon | `is_restaurant_active()` SECURITY DEFINER |
| Order placement fails | Same EXISTS check in INSERT policy | Same function fix |
| External ads showing | Platform ads (Swiggy/Zomato) rendered | Remove ad components from CustomerMenu |
| Promotions missing | Offers RLS blocks anon reads | Same function fix |

**Files to modify:**
- 1 new database migration (RLS fix + helper function)
- `src/pages/CustomerMenu.tsx` (remove external ads, keep offers)

