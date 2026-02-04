
# QR Dine Pro - Production-Ready Transformation Plan

## Executive Summary

Transform the current mock-data based restaurant system into a fully functional, production-ready multi-tenant SaaS platform with real database operations, real-time updates, thermal printer integration, and comprehensive admin controls.

## Current State Analysis

**What Exists:**
- Database schema with 12 multi-tenant tables (restaurants, orders, menu_items, etc.)
- RLS policies and security functions (has_role, get_user_restaurant_id)
- Real-time enabled on orders, order_items, waiter_calls tables
- Authentication system with role-based routing
- UI components for all dashboards (Kitchen, Billing, Waiter, Admin, Customer)
- Cart store (Zustand), sound hooks, thermal receipt component

**Critical Issues to Fix:**
- All dashboards use mock data from `src/data/mockData.ts` instead of Supabase
- No real-time subscriptions implemented in components
- Kitchen/Billing dashboards lack production real-time updates
- Customer menu uses local state instead of database
- No thermal printer integration (ESC/POS)
- Admin sidebar missing required routes (orders, kitchen, billing, ads, reviews)
- No ads popup in customer menu
- Feedback system not connected to restaurant context

---

## Phase 1: Database Enhancements

### 1.1 Add Missing Tables

```text
NEW TABLES:
+-----------------+--------------------------------+
| printer_queue   | Offline print queue fallback   |
| invoices        | Completed invoice records      |
+-----------------+--------------------------------+

COLUMNS TO ADD:
- restaurants.printer_settings (jsonb)
- restaurants.review_settings (jsonb)  
- restaurants.ads_enabled (boolean)
```

### 1.2 Seed Demo Restaurant

Create a demo restaurant with sample data for immediate testing:
- Restaurant: "Demo Restaurant" with slug "demo"
- Categories: Starters, Burgers, Pizza, Main Course, Desserts, Beverages
- Menu Items: 12 items with images
- Tables: T1-T8

---

## Phase 2: Replace Mock Data with Live Supabase

### 2.1 Create Data Hooks

| Hook | Purpose |
|------|---------|
| `useRestaurant` | Fetch restaurant config by ID/slug |
| `useMenuItems` | Fetch menu items with categories |
| `useTables` | Fetch tables for restaurant |
| `useOrders` | Fetch/subscribe to orders |
| `useWaiterCalls` | Fetch/subscribe to waiter calls |
| `useFeedback` | Fetch feedback entries |
| `useAds` | Fetch active ads |

### 2.2 Files to Refactor

| File | Changes |
|------|---------|
| `AdminDashboard.tsx` | Replace mockData with useOrders, useMenuItems, useTables |
| `KitchenDashboard.tsx` | Use useOrders with real-time subscription |
| `BillingCounter.tsx` | Use useOrders for ready orders |
| `WaiterDashboard.tsx` | Use useTables, useWaiterCalls with real-time |
| `CustomerMenu.tsx` | Use useMenuItems, useRestaurant based on URL params |

---

## Phase 3: Real-Time Subscriptions

### 3.1 Implementation Pattern

```text
Kitchen Dashboard Flow:
+------------------+     +-----------------+     +------------------+
| Customer places  | --> | INSERT to       | --> | Kitchen receives |
| order via menu   |     | orders table    |     | real-time update |
+------------------+     +-----------------+     +------------------+
                                                         |
                                                         v
                                                 +------------------+
                                                 | Sound alert +    |
                                                 | card animation   |
                                                 +------------------+
```

### 3.2 Real-Time Channels

| Channel | Tables | Events |
|---------|--------|--------|
| `kitchen-{restaurant_id}` | orders, order_items | INSERT, UPDATE |
| `waiter-{restaurant_id}` | waiter_calls, tables | INSERT, UPDATE |
| `billing-{restaurant_id}` | orders | UPDATE (to ready) |

---

## Phase 4: Customer Menu Redesign

### 4.1 UI Enhancement (Match Reference Image)

Based on uploaded image `image-2.png`:
- Category icons with circular backgrounds (Burger, Pizza, Fries, Dessert)
- Search bar with filter icon
- "Recently Ordered" section
- "Most Popular" section with "See All" link
- Item cards with large images, descriptions, prices
- Item detail page with:
  - Large hero image
  - Name, description, rating
  - Quantity selector
  - Add-ons/customizations (Chicken, Cheese, Tomato with checkboxes)
  - "Add to cart" button with total price

### 4.2 Customer Flow

```text
URL: /order?r={restaurant_id}&table={table_id}

+-------------+     +----------------+     +---------------+
| Ads Popup   | --> | Menu Browse    | --> | Item Detail   |
| (if active) |     | with cart      |     | + Add-ons     |
+-------------+     +----------------+     +---------------+
                           |
                           v
                    +----------------+     +---------------+
                    | Cart Review    | --> | Order Placed  |
                    | + Instructions |     | Track Status  |
                    +----------------+     +---------------+
```

---

## Phase 5: Kitchen Display Enhancement

### 5.1 UI Updates (Match Reference Image)

Based on uploaded image `Screenshot_2026-02-04_110329.png`:
- Clean header with "Kitchen Display" title
- Waiter calls pending banner (yellow)
- Three columns: Pending (1), Preparing (1), Ready (1)
- Order cards with:
  - Table badge (T1, T3, T5)
  - Order number (#ORD001)
  - Time elapsed (5m)
  - Item list (1x Classic Burger, 1x Chicken Biryani)
  - Action button (Start Preparation / Mark Ready)

### 5.2 Full-Screen Mode

- No sidebar
- High contrast colors
- Touch-friendly large buttons
- Sound alerts with visual pulse animation

---

## Phase 6: Billing Counter Enhancement

### 6.1 UI Updates (Match Reference Image)

Based on uploaded image:
- Header with "Billing Counter" and order count
- Tabs: Billing, History, Analytics
- "Ready for Billing" section with order cards
- Invoice panel with:
  - Itemized list
  - Subtotal, Tax, Total
  - Printer icon
- Payment method buttons (Cash, Card, UPI)
- "Charge" button (orange with rupee symbol)

### 6.2 Manual Item Addition

- Allow adding items not in original order
- Discount application
- Split bill functionality

---

## Phase 7: Thermal Printer Integration

### 7.1 ESC/POS Implementation

```text
Print Flow:
+---------------+     +------------------+     +----------------+
| Invoice Data  | --> | ESC/POS Format   | --> | Send to        |
| from Billing  |     | (80mm thermal)   |     | Bluetooth/USB  |
+---------------+     +------------------+     +----------------+
                                                      |
                                                      v (if offline)
                                              +----------------+
                                              | Save to        |
                                              | printer_queue  |
                                              +----------------+
```

### 7.2 Files to Create

| File | Purpose |
|------|---------|
| `src/lib/printer/escpos.ts` | ESC/POS command builder |
| `src/lib/printer/bluetooth.ts` | Web Bluetooth connection |
| `src/lib/printer/usb.ts` | Web USB connection |
| `src/hooks/usePrinter.ts` | Printer management hook |
| `src/components/billing/PrinterStatus.tsx` | Connection status UI |

### 7.3 Fallback Queue

If printer offline:
1. Save to `printer_queue` table
2. Show pending icon in UI
3. Retry when connection restored
4. Manual retry button

---

## Phase 8: Admin Dashboard Expansion

### 8.1 Sidebar Routes (Required)

| Route | Component | Features |
|-------|-----------|----------|
| `/admin` | Dashboard | Stats, recent orders, charts |
| `/admin/menu` | Menu CRUD | Add/edit/delete items, categories |
| `/admin/tables` | Tables & QR | Manage tables, generate QR codes |
| `/admin/orders` | Order History | Filter, search, export CSV |
| `/admin/kitchen` | Kitchen View | Embedded KDS (optional) |
| `/admin/billing` | Billing View | Embedded billing (optional) |
| `/admin/ads` | Ads Manager | Create/edit ads, set frequency |
| `/admin/reviews` | Feedback | View ratings, enable Google redirect |
| `/admin/settings` | Settings | Restaurant info, printer, tax, roles |

### 8.2 New Admin Components

| Component | Purpose |
|-----------|---------|
| `MenuManager.tsx` | Full CRUD with image upload |
| `TableManager.tsx` | Add/edit tables, bulk QR download |
| `OrderHistory.tsx` | Paginated order list with filters |
| `AdsManager.tsx` | Ad campaign management |
| `FeedbackManager.tsx` | Review moderation, CSV export |
| `SettingsPanel.tsx` | All toggles and configurations |

---

## Phase 9: Ads System

### 9.1 Customer-Facing

- Popup modal on menu load (if ads enabled)
- Close button (X) mandatory
- Frequency control: once per session / once per day
- Image with optional CTA button

### 9.2 Admin Controls

- Create/edit ad campaigns
- Upload image (Supabase Storage)
- Set active/inactive
- Set display dates
- Track impressions and clicks

---

## Phase 10: Feedback & Reviews Enhancement

### 10.1 Flow Refinement

```text
Post-Order Trigger:
+----------------+     +---------------+     +------------------+
| Order Complete | --> | Feedback      | --> | Rating >= 4?     |
| via Billing    |     | Prompt        |     | Redirect Google  |
+----------------+     +---------------+     +------------------+
                                                      |
                                              Rating < 4 |
                                                      v
                                              +------------------+
                                              | Internal Form    |
                                              | (save to DB)     |
                                              +------------------+
```

### 10.2 Admin Review Panel

- View all feedback with filters
- Rating distribution chart
- Enable/disable Google redirect
- Export to CSV

---

## File Structure Summary

```text
NEW FILES TO CREATE:
src/
├── hooks/
│   ├── useRestaurant.ts
│   ├── useMenuItems.ts
│   ├── useTables.ts
│   ├── useOrders.ts
│   ├── useWaiterCalls.ts
│   ├── useFeedback.ts
│   ├── useAds.ts
│   └── usePrinter.ts
├── lib/
│   └── printer/
│       ├── escpos.ts
│       ├── bluetooth.ts
│       └── usb.ts
├── components/
│   ├── admin/
│   │   ├── MenuManager.tsx
│   │   ├── TableManager.tsx
│   │   ├── OrderHistory.tsx
│   │   ├── AdsManager.tsx
│   │   ├── FeedbackManager.tsx
│   │   └── SettingsPanel.tsx
│   ├── billing/
│   │   └── PrinterStatus.tsx
│   └── customer/
│       ├── AdsPopup.tsx
│       ├── CategoryIcons.tsx
│       ├── ItemDetailModal.tsx
│       └── RecentlyOrdered.tsx

FILES TO REFACTOR:
├── pages/
│   ├── AdminDashboard.tsx    (live data + expanded routes)
│   ├── KitchenDashboard.tsx  (real-time + UI polish)
│   ├── BillingCounter.tsx    (printer integration)
│   ├── WaiterDashboard.tsx   (real-time)
│   ├── CustomerMenu.tsx      (complete redesign)
│   └── FeedbackPage.tsx      (restaurant context)
├── components/admin/
│   └── AdminSidebar.tsx      (add missing routes)
└── stores/
    └── cartStore.ts          (persist to localStorage)
```

---

## Database Migration Required

```text
NEW TABLES:
1. printer_queue
   - id, restaurant_id, order_id, receipt_data, status, created_at

2. invoices  
   - id, order_id, restaurant_id, invoice_number, data, created_at

COLUMNS TO ADD:
- restaurants.printer_settings (jsonb)
- restaurants.review_settings (jsonb)
- restaurants.ads_enabled (boolean, default true)

SEED DATA:
- Demo restaurant with full sample data
```

---

## Implementation Order

| Phase | Tasks | Priority |
|-------|-------|----------|
| 1 | Database enhancements + seed data | High |
| 2 | Create data hooks (useOrders, useMenuItems, etc.) | High |
| 3 | Refactor Kitchen Dashboard with real-time | High |
| 4 | Refactor Billing Counter with real-time | High |
| 5 | Refactor Customer Menu (new design) | High |
| 6 | Add thermal printer integration | Medium |
| 7 | Expand Admin Dashboard routes | Medium |
| 8 | Add Ads system (popup + admin) | Medium |
| 9 | Enhance Feedback system | Medium |
| 10 | Add Settings panel | Low |

---

## Technical Notes

### Dependencies Already Installed
- Supabase client configured
- Framer Motion for animations
- Zustand for state management
- QRCode.react for QR generation
- Sound hook for notifications

### No New Dependencies Needed
- Web Bluetooth API (browser native)
- Web USB API (browser native)
- ESC/POS commands (pure JavaScript implementation)

### Security Considerations
- All data hooks filter by restaurant_id
- RLS policies already in place
- Role checks before dashboard access
- No sensitive data exposed to customers
