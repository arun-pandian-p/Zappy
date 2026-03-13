# ZAPPY — Full System Architecture

Your project is already 100% connected to Lovable Cloud. Every hook, page, and edge function communicates with the live backend. No migration or transfer is needed.

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)              │
│                                                             │
│  Public Routes          Staff Routes         Admin Routes   │
│  ─────────────          ────────────         ────────────   │
│  /                      /kitchen (guarded)   /admin         │
│  /customer-menu         /waiter  (guarded)   /super-admin   │
│  /feedback              /billing (guarded)   /admin/onboard │
│  /login, /roles                                             │
│                                                             │
│  Auth: useAuth hook + RoleGuard component                   │
│  State: React Query + Zustand (cart)                        │
│  Real-time: Supabase channels (orders, tables, categories)  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    Supabase JS Client
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    LOVABLE CLOUD (Backend)                   │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │    AUTH      │  │   DATABASE   │  │  EDGE FUNCTIONS   │  │
│  │             │  │  (Postgres)  │  │                   │  │
│  │ Email/Pass  │  │  20 tables   │  │ create-tenant     │  │
│  │ Role-based  │  │  + 1 view    │  │ manage-staff      │  │
│  │ JWT tokens  │  │  Full RLS    │  │ manage-super-admins│  │
│  └─────────────┘  └──────────────┘  │ push-invoice      │  │
│                                     │ qr-redirect       │  │
│  ┌─────────────┐  ┌──────────────┐  │ firecrawl-scrape  │  │
│  │  STORAGE    │  │  REALTIME    │  │ firecrawl-search  │  │
│  │             │  │              │  └───────────────────┘  │
│  │ menu-images │  │ orders       │                         │
│  │ (50MB)      │  │ order_items  │                         │
│  │ platform-   │  │ tables       │                         │
│  │ assets(5MB) │  │ categories   │                         │
│  └─────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Tables (20 + 1 view)

| Table | Purpose | RLS |
|---|---|---|
| **restaurants** | Tenant profiles, branding, settings | Staff own, super_admin all, public read active |
| **restaurants_public** | Safe public view (no PII) | Open read (security_invoker) |
| **user_roles** | Role assignments (app_role enum) | Scoped by role hierarchy |
| **categories** | Menu categories per restaurant | Staff manage, public read active |
| **menu_items** | Food items with pricing/tags | Staff manage, public read available |
| **variant_groups / variant_options** | Item size/type variants | Staff manage, public read |
| **addon_groups / addon_options** | Extra toppings/add-ons | Staff manage, public read |
| **orders** | Customer orders | Anon create, staff manage |
| **order_items** | Line items per order | Anon create, staff update |
| **tables** | Physical table management | Staff manage, public read active |
| **invoices** | Billing records | Staff only |
| **coupons** | Discount codes | Staff manage, public read active |
| **offers** | Promotional offers | Staff + super_admin manage |
| **ads** | Advertisements | Restaurant admin + super_admin |
| **feedback** | Customer ratings | Anon create, staff read |
| **qr_codes** | QR code tracking | Staff manage, public read active |
| **scan_analytics** | QR scan telemetry | Anon insert, staff read |
| **inventory_items** | Stock management | Staff only |
| **recipe_mappings** | Inventory-to-menu links | Staff only |
| **customer_events** | Behavior tracking | Anon insert, staff read |
| **analytics_daily** | Aggregated daily stats | Staff + super_admin read |
| **analytics_events** | Raw analytics events | Anon insert, staff read |
| **waiter_calls** | Table call-waiter requests | Anon create, staff manage |
| **subscription_plans** | SaaS tier definitions | Super_admin manage, public read |
| **platform_settings** | Global platform config | Super_admin only |
| **default_tax_settings** | Default tax config | Super_admin only |
| **email_templates** | Email template management | Super_admin only |
| **system_logs** | Audit trail | Super_admin read, no client insert |

---

## Role System (app_role enum)

| Role | Access |
|---|---|
| **super_admin** | All tables, all restaurants, bypasses all guards |
| **restaurant_admin** | Own restaurant data, staff management, settings |
| **kitchen_staff** | Orders, order items (own restaurant) |
| **waiter_staff** | Orders, tables, waiter calls (own restaurant) |
| **billing_staff** | Orders, invoices, billing (own restaurant) |
| **Anonymous** | Menu viewing, order placement, feedback, QR scans |

---

## Security Functions

| Function | Purpose |
|---|---|
| `has_role(user_id, role)` | SECURITY DEFINER — prevents RLS recursion |
| `get_user_restaurant_id(user_id)` | Returns tenant scope for RLS policies |
| `increment_scan_count(qr_id)` | Safe QR scan counter |
| `update_updated_at_column()` | Trigger for timestamp management |

---

## Edge Functions (7)

| Function | JWT | Purpose |
|---|---|---|
| `create-tenant` | No | Provisions new restaurant + admin account |
| `manage-staff` | No | Server-side staff CRUD (avoids session conflicts) |
| `manage-super-admins` | No | Super admin team management |
| `push-invoice` | Yes | Invoice generation |
| `qr-redirect` | No | QR code redirect + scan tracking |
| `firecrawl-scrape` | No | Web scraping for market research |
| `firecrawl-search` | No | Web search for market research |

---

## Frontend Data Hooks (30+)

`useAuth`, `useMenuItems`, `useCategories`, `useOrders`, `useTables`, `useInvoices`, `useCoupons`, `useOffers`, `useAds`, `useFeedback`, `useInventory`, `useQRCodes`, `useWaiterCalls`, `useAddons`, `useVariants`, `useRestaurant`, `useSubscriptionPlans`, `usePlatformSettings`, `useSystemLogs`, `useLeaderboard`, `useEmailTemplates`, `useDefaultTaxSettings`, `useCustomerEvents`, `useExports`, `useSuperAdminProfile`, `useLandingCMS`, `useTableSessions`, `useFeatureGate`, `usePrinter`, `useSound`

---

## Real-time Channels

Enabled on: `orders`, `order_items`, `tables`, `categories`, `restaurants`, `staff_profiles`, `user_roles`, `system_logs`

---

## Storage Buckets

| Bucket | Limit | Purpose |
|---|---|---|
| `menu-images` | 50MB | Food photos, ad images |
| `platform-assets` | 5MB | Logos, favicons, banners |

---

## Status: ✅ Fully Connected & Production-Ready
