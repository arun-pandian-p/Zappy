

# Full Integration Plan: Shopify + Firecrawl + Analytics + Security

## 1. Shopify Store (Meal Kits / Food Products)

### New Files
| File | Purpose |
|------|---------|
| `src/lib/shopify.ts` | Storefront API helper, product types, cart mutations |
| `src/stores/shopifyCartStore.ts` | Zustand cart state (separate from existing restaurant cartStore) |
| `src/hooks/useShopifyProducts.ts` | React Query hook to fetch products from Storefront API |
| `src/hooks/useCartSync.ts` | Cart sync hook for checkout completion detection |
| `src/pages/Shop.tsx` | Shop page with product grid, cart drawer |
| `src/pages/ShopProduct.tsx` | Individual product detail page at `/shop/product/:handle` |
| `src/components/shop/ProductCard.tsx` | Product card with image, title, price, Add to Cart |
| `src/components/shop/CartDrawer.tsx` | Sheet-based cart with checkout via Storefront API |
| `src/components/shop/ShopHeader.tsx` | Shop navigation bar with cart icon + badge |

### Config
- Store domain: `qr-restaurant-0m5d4.myshopify.com`
- Storefront token: `32f5a47cee8fe075a9aae22525c81ff4`
- API version: `2025-07`
- All checkout URLs use `channel=online_store` param and open in new tab

### Routes to Add
- `/shop` -- Product listing page
- `/shop/product/:handle` -- Product detail page

### Cart Flow
Add to Cart -> Zustand store -> Storefront API `cartCreate` / `cartLinesAdd` -> Checkout URL opens in new tab

### Products
- Store is empty -- will show "No products found" with prompt to create via chat
- No mock/fake products

---

## 2. Firecrawl Integration (Market Research, Competitor Menus, Content)

### New Files
| File | Purpose |
|------|---------|
| `src/lib/api/firecrawl.ts` | Frontend API wrapper calling edge functions |
| `supabase/functions/firecrawl-scrape/index.ts` | Edge function for scraping URLs |
| `supabase/functions/firecrawl-search/index.ts` | Edge function for web search |
| `src/components/admin/MarketResearch.tsx` | Admin panel tab for scraping competitor menus and searching market data |

### How It Works
- Admin dashboard gets a new "Market Research" tab
- Scrape: paste a competitor's menu URL, extract content as markdown
- Search: search for restaurant trends, menu ideas, pricing data
- Results displayed in a clean card layout within admin panel
- Edge functions use `FIRECRAWL_API_KEY` from secrets (already configured)

---

## 3. Analytics Improvements

### Enhanced Revenue Dashboards
| File | Action |
|------|--------|
| `src/components/analytics/RevenueChart.tsx` | Modify -- add weekly/monthly toggle, better Recharts config |
| `src/components/analytics/DashboardStats.tsx` | Modify -- add real-time order count, avg prep time from `analytics_daily` |
| `src/components/analytics/CustomerBehaviorPanel.tsx` | Create -- visualize `customer_events` data (menu views, cart adds, conversions) |

### Real-time Order Analytics
- Use existing `customer_events` table and `useCustomerEvents` hook
- Add conversion funnel visualization: Menu Views -> Cart Adds -> Orders Placed
- Add session-based behavior tracking chart (already tracked in DB)
- Wire existing `analytics_daily` aggregates into dashboard charts

### Customer Behavior Tracking
- Already have `customer_events` table with tracking hooks
- Build a visual funnel component showing drop-off rates
- Add hourly heatmap for peak ordering times

---

## 4. Security Fixes

### Issue 1: Leaked Password Protection (Warning)
- Enable leaked password protection in auth settings

### Issue 2: Staff Email Exposure (Critical)
- The `staff_profiles` table has RLS policies already restricting access to restaurant admins and super admins
- The scan flagged this as a concern for when data exists -- current policies are correct
- Mark as addressed with note explaining existing RLS coverage

### Issue 3: Invoice Customer Data (Critical)
- The `invoices` table already has RLS policies restricting to restaurant staff
- Current policies: staff can create and view their restaurant's invoices
- Additional hardening: remove the fallback anonymous access for restaurant `00000000-...` in the "Allow invoice operations" policy via migration

### Issue 4: Waiter Calls Unrestricted Read (Warning)
- Current policy allows anyone to SELECT from `waiter_calls` (needed for real-time customer tracking)
- This is intentional for the QR ordering flow where customers see waiter call status
- Mark as acknowledged with explanation

### Database Migration Needed
- Remove the overly permissive anonymous fallback from invoices RLS policy
- Tighten the `Allow invoice operations` policy to remove the `auth.uid() IS NULL` condition

---

## Implementation Order

1. Security fixes (database migration for invoices RLS)
2. Shopify store setup (lib, store, pages, components, routes)
3. Firecrawl edge functions + admin panel
4. Analytics dashboard enhancements
5. Wire `useCartSync` into App.tsx

## App.tsx Route Additions
```text
/shop                    -> Shop.tsx (product listing)
/shop/product/:handle    -> ShopProduct.tsx (product detail)
```

