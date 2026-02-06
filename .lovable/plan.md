
# QR Companion - Complete Multi-Tenant SaaS Platform Implementation Plan

## Executive Summary

This plan transforms "QR Dine Pro" into a fully production-ready "QR Companion" multi-tenant SaaS platform. Based on the provided PRD and reference UI designs, we will implement missing modules while enhancing existing features to match the professional dashboard interfaces shown in the mockups.

## Current State Analysis

### Already Implemented (Working)
| Module | Status | Notes |
|--------|--------|-------|
| Multi-tenant schema | Complete | `restaurant_id` on all tables |
| Menu CRUD | Complete | Add, edit, delete, toggle availability |
| Table & QR Management | Complete | Create tables, generate QR codes |
| Kitchen Display | Complete | Real-time order queue with status updates |
| Billing Counter | Complete | Order billing, payment methods, invoice generation |
| Customer Menu | Complete | QR scan, browse, add to cart, place order |
| Settings Panel | Complete | Tax, currency, printer, reviews config |
| Super Admin (Basic) | Partial | Create restaurants, manage tiers |

### Missing or Incomplete Features
| Module | Status | Priority |
|--------|--------|----------|
| Analytics Dashboard with Charts | Missing | High |
| Hotel Admin Dashboard (redesign) | Missing | High |
| Super Admin Analytics | Missing | High |
| Revenue/Order Charts | Missing | High |
| CSV Export Engine | Missing | Medium |
| Coupons & Offers System | Missing | Medium |
| Customer Behavior Tracking | Missing | Medium |
| Table Session Timers | Missing | Medium |
| Branding Customization (logo/colors) | Partial | Medium |
| Operating Hours | Missing | Low |
| Multi-branch Support | Missing | Low |

---

## Implementation Phases

### Phase 1: Enhanced Analytics Dashboard (Hotel Admin)

Based on the "Hotel Admin Dashboard" reference design, we'll create a data-rich dashboard with:

**Components to Create:**
```text
src/components/analytics/
  ├── RevenueChart.tsx       # 7-day revenue line chart
  ├── OrdersTable.tsx        # Recent orders with timing data
  ├── DashboardStats.tsx     # Today's revenue, avg order value
  ├── RevenueTrends.tsx      # Revenue trends table
  └── WaitTimeMetrics.tsx    # Average wait times per table
```

**Database Requirements:**
- New `analytics_daily` table for aggregated daily metrics
- Add `prep_time`, `wait_time` columns to orders
- Create database function to calculate daily aggregations

**Features:**
- Today's Revenue (large number display)
- Average Order Value
- 7-Day Revenue Chart (using Recharts)
- Revenue Trends table with filtering
- Orders table with timing data (wait time, prep time)
- Real-time updates via Supabase subscriptions

---

### Phase 2: Enhanced Super Admin Dashboard

Based on the "Super Admin Dashboard" reference design:

**Components to Create:**
```text
src/components/superadmin/
  ├── TenantStats.tsx           # Total tenants, active, by plan
  ├── RevenueMetrics.tsx        # Platform-wide revenue
  ├── MonthlyTrendChart.tsx     # Monthly revenue trends
  ├── TenantTable.tsx           # All tenants with status/revenue
  ├── CampaignPerformance.tsx   # Ad campaign metrics
  └── BillingPlansManager.tsx   # Manage subscription plans
```

**Database Requirements:**
- Create `platform_revenue` view (aggregates all tenant revenue)
- Add `campaigns` table for platform ads

**Features:**
- Tenant count cards (total, active, by plan tier)
- Platform revenue stats ($7,530 / $8,636 style)
- Active campaigns count
- Monthly revenue trend chart
- Tenant performance table (revenue per tenant)
- Campaign performance tracking

---

### Phase 3: Kitchen Display System Enhancement

Based on the "Kitchen Display System" reference design:

**UI Improvements:**
- Dark theme optimized for kitchen screens
- Kanban-style columns: New → Preparing → Completed
- Food item images in order cards
- Status tabs: New, NDVS, Preparing, Completed, Settings
- Timer displays on each order
- Sound alert configuration

**Components to Update:**
```text
src/pages/KitchenDashboard.tsx
  - Add food images to order items
  - Add prep timer per order
  - Implement kanban drag-and-drop
  - Add status filter tabs
```

**Database Requirements:**
- Add `started_preparing_at` to orders
- Add `ready_at` to orders
- Calculate prep duration in real-time

---

### Phase 4: Billing POS Interface Enhancement

Based on the "Billing POS Interface" reference design:

**UI Improvements:**
- Split view: Tables list | Order items | Bill summary
- Table selector on left panel
- Item editing with quantity controls
- Number pad for manual entry
- Discount buttons (0%, 15%, 20%, 5%)
- "Charge" button with total amount
- New Order / Order / Close Order actions

**Components to Create:**
```text
src/components/billing/
  ├── TableSelector.tsx    # Left panel table list
  ├── OrderItemsGrid.tsx   # Center items grid
  ├── BillSummary.tsx      # Right summary panel
  ├── NumberPad.tsx        # Numeric entry pad
  └── DiscountButtons.tsx  # Quick discount selection
```

---

### Phase 5: CSV Export Engine

**Components to Create:**
```text
src/hooks/useExports.ts
src/components/admin/ExportPanel.tsx
```

**Export Types:**
- Orders history (with filters)
- Revenue reports (date range)
- Item sales breakdown
- Tax summaries

**Implementation:**
```typescript
// useExports.ts
export function useExportOrders() {
  return useMutation({
    mutationFn: async ({ restaurantId, dateRange, filters }) => {
      // Fetch data
      const { data } = await supabase.from('orders')...
      // Convert to CSV
      const csv = convertToCSV(data);
      // Trigger download
      downloadCSV(csv, `orders-${dateRange}.csv`);
    }
  });
}
```

---

### Phase 6: Coupons & Offers System

**Database Migration:**
```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id),
  code TEXT NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  max_discount_amount NUMERIC,
  min_order_amount NUMERIC,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Components:**
```text
src/hooks/useCoupons.ts
src/components/admin/CouponManager.tsx
src/components/order/CouponInput.tsx  # Customer-facing
```

---

### Phase 7: Customer Behavior Tracking

**Database Migration:**
```sql
CREATE TABLE customer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id),
  session_id TEXT,
  table_id UUID REFERENCES tables(id),
  event_type TEXT NOT NULL, -- 'menu_view', 'item_view', 'cart_add', 'cart_remove', 'order_placed', 'cart_abandoned'
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Tracking Events:**
- Menu page views
- Item detail views
- Cart additions/removals
- Cart abandonment
- Order placement

**Implementation:**
```text
src/hooks/useAnalytics.ts  # Track events
src/components/analytics/BehaviorReport.tsx  # Admin view
```

---

### Phase 8: Table Session & Timer System

**Database Migration:**
```sql
CREATE TABLE table_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id),
  table_id UUID REFERENCES tables(id),
  status TEXT DEFAULT 'waiting', -- 'waiting', 'seated', 'ordering', 'served', 'billing', 'completed'
  seated_at TIMESTAMPTZ,
  order_placed_at TIMESTAMPTZ,
  food_ready_at TIMESTAMPTZ,
  served_at TIMESTAMPTZ,
  billing_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Timer Types:**
| Timer | Start | End |
|-------|-------|-----|
| Table Wait | Seated | Order placed |
| Kitchen Prep | Order confirmed | Ready |
| Service | Ready | Served |
| Billing | Served | Paid |

---

### Phase 9: Branding & White-Label

**Database Updates:**
```sql
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS
  font_family TEXT DEFAULT 'Inter',
  banner_image_url TEXT,
  favicon_url TEXT,
  menu_title TEXT;
```

**Components:**
```text
src/components/admin/BrandingManager.tsx
  - Logo upload
  - Color picker (primary/secondary)
  - Font selection
  - Banner image upload
```

**Customer Menu Update:**
- Apply restaurant's theme colors
- Show restaurant logo
- Use custom font family

---

## File Changes Summary

### New Files to Create

| Path | Purpose |
|------|---------|
| `src/components/analytics/RevenueChart.tsx` | 7-day revenue line chart |
| `src/components/analytics/OrdersTable.tsx` | Orders with timing metrics |
| `src/components/analytics/DashboardStats.tsx` | Revenue stat cards |
| `src/components/analytics/RevenueTrends.tsx` | Trend table |
| `src/components/superadmin/TenantStats.tsx` | Platform stats |
| `src/components/superadmin/MonthlyTrendChart.tsx` | Revenue chart |
| `src/components/superadmin/CampaignPerformance.tsx` | Ad metrics |
| `src/components/billing/TableSelector.tsx` | Table list panel |
| `src/components/billing/NumberPad.tsx` | Numeric keypad |
| `src/components/billing/DiscountButtons.tsx` | Quick discounts |
| `src/components/admin/CouponManager.tsx` | CRUD coupons |
| `src/components/admin/ExportPanel.tsx` | CSV export UI |
| `src/components/admin/BrandingManager.tsx` | Theme settings |
| `src/components/order/CouponInput.tsx` | Apply coupon |
| `src/hooks/useCoupons.ts` | Coupon API |
| `src/hooks/useExports.ts` | CSV export |
| `src/hooks/useTableSessions.ts` | Session timers |
| `src/hooks/useCustomerEvents.ts` | Behavior tracking |

### Files to Update

| Path | Changes |
|------|---------|
| `src/pages/AdminDashboard.tsx` | Add analytics charts, new layout per reference |
| `src/pages/SuperAdminDashboard.tsx` | Add charts, tenant table, campaign metrics |
| `src/pages/KitchenDashboard.tsx` | Add images, dark theme, kanban view |
| `src/pages/BillingCounter.tsx` | Split panel layout, number pad |
| `src/pages/CustomerMenu.tsx` | Add behavior tracking, coupon input |
| `src/components/admin/SettingsPanel.tsx` | Add branding section |

### Database Migrations

| Migration | Tables/Changes |
|-----------|----------------|
| Analytics tables | `analytics_daily`, `customer_events` |
| Coupons system | `coupons` table |
| Table sessions | `table_sessions` table |
| Order timing | Add `started_preparing_at`, `ready_at` to orders |
| Branding | Add `font_family`, `banner_image_url`, `favicon_url` to restaurants |

---

## Implementation Order

### Sprint 1 (Core Analytics)
1. Hotel Admin Dashboard with charts
2. Super Admin Dashboard with metrics
3. CSV Export Engine

### Sprint 2 (Kitchen & Billing)
4. Kitchen Display enhancements
5. Billing POS redesign
6. Table session timers

### Sprint 3 (Marketing & Tracking)
7. Coupons & Offers system
8. Customer behavior tracking
9. Branding customization

---

## Technical Architecture

### Chart Library
Using existing `recharts` package for all visualizations:
- Line charts for revenue trends
- Bar charts for order volumes
- Pie charts for payment breakdown

### Real-time Updates
Existing Supabase real-time subscriptions will be extended to:
- Analytics events
- Table session status
- Campaign metrics

### Export Engine
Client-side CSV generation using:
```typescript
function convertToCSV(data: Record<string, unknown>[]): string {
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(','));
  return [headers, ...rows].join('\n');
}
```

---

## Success Metrics

After implementation:
- Admin Dashboard shows live revenue charts
- Super Admin can view platform-wide analytics
- Kitchen staff see food images and prep timers
- Billing counter has professional POS interface
- All data exports to CSV
- Coupons apply at checkout
- Customer behavior is tracked for insights
- Table sessions show wait times
- Restaurants can customize branding
