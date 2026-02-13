

# QR Generator System -- Hosted Subdomain SaaS Enhancement

## What Already Exists

Your app already has a strong multi-tenant foundation:
- Restaurant management with tenant isolation (restaurant_id on all tables)
- Table-based QR code generation (QuickQRSection component)
- Customer menu loaded via QR scan (/order?r=ID&table=N)
- Admin and Super Admin dashboards
- Analytics events tracking

## What This Plan Adds

The PDR identifies several gaps to turn this into a full QR SaaS platform. Here is the implementation plan:

---

## Phase 1: Database -- New Tables

### 1.1 `qr_codes` Table
Dedicated QR code management separate from tables, supporting dynamic/static QR, scan tracking, and expiration.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| tenant_id | UUID | References restaurants |
| qr_name | TEXT | Label for the QR |
| target_url | TEXT | Destination URL |
| qr_type | TEXT | 'static' or 'dynamic' |
| scan_count | INTEGER | Auto-incremented on scan |
| expires_at | TIMESTAMPTZ | Optional expiry |
| is_active | BOOLEAN | Default true |
| metadata | JSONB | Logo, colors, frame config |
| created_at | TIMESTAMPTZ | |

RLS: Restaurant staff can manage their own QR codes. Public can view active QR codes for redirect resolution.

### 1.2 `scan_analytics` Table
Tracks every QR scan with device/geo data.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| qr_id | UUID | References qr_codes |
| tenant_id | UUID | References restaurants |
| scanned_at | TIMESTAMPTZ | Default now() |
| device | TEXT | Mobile/Desktop/Tablet |
| country | TEXT | From IP geolocation |
| city | TEXT | From IP geolocation |
| user_agent | TEXT | Raw UA string |
| referrer | TEXT | Where scan originated |

RLS: Anyone can INSERT (scans are anonymous). Restaurant staff can SELECT their own analytics.

### 1.3 `pages` Table
Content pages per tenant (menu, landing, custom).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| tenant_id | UUID | References restaurants |
| page_slug | TEXT | e.g., /menu, /landing |
| page_type | TEXT | 'menu', 'landing', 'custom' |
| content_json | JSONB | Layout/content data |
| is_published | BOOLEAN | Default false |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

RLS: Restaurant staff can manage their pages. Public can view published pages for active restaurants.

---

## Phase 2: QR Scan Redirect Edge Function

### `supabase/functions/qr-redirect/index.ts`
- Accepts QR code ID as path parameter
- Looks up the QR code's target_url
- Logs scan analytics (device from User-Agent, IP for geo)
- Returns 302 redirect to target_url
- Handles expired/inactive QR codes with a friendly error page
- Config: `verify_jwt = false` (public endpoint)

URL pattern: `https://{project}.supabase.co/functions/v1/qr-redirect/{qr_id}`

Dynamic QR codes resolve through this function. Static QR codes point directly to the tenant URL.

---

## Phase 3: Enhanced QR Generator (Admin Panel)

### 3.1 New Component: `src/components/admin/QRCodeManager.tsx`
Replaces/extends the current "Tables & QR" tab with a full QR management system:

- **QR List View**: Table showing all QR codes with name, target URL, scan count, status, created date
- **Create QR Dialog**: Form with name, target URL, type (static/dynamic), optional expiry
- **QR Design Customization**:
  - Logo embed (upload restaurant logo into QR center)
  - Color picker for QR foreground/background
  - Frame text (e.g., "Scan to Order")
  - Shape style selection (squares, dots, rounded)
- **Bulk QR Generator**: Upload CSV with columns (name, target_url) to create multiple QR codes at once
- **Download Options**: PNG (high-res 512px) and SVG export per QR code
- **Analytics Preview**: Mini chart showing scan count trend per QR code

### 3.2 New Hook: `src/hooks/useQRCodes.ts`
- `useQRCodes(restaurantId)` -- fetch all QR codes
- `useCreateQRCode()` -- create new QR
- `useUpdateQRCode()` -- update target URL, design
- `useDeleteQRCode()` -- soft delete
- `useQRScanAnalytics(qrId)` -- fetch scan data for a specific QR

### 3.3 Update AdminSidebar
- Rename "Tables & QR" to "QR Codes" or add a separate "QR Manager" nav item
- Keep table management as a sub-section within the tab

---

## Phase 4: Scan Analytics Dashboard

### New Component: `src/components/analytics/QRScanAnalytics.tsx`
Added to the admin Dashboard tab:

- **Scan Volume Chart**: Line chart showing scans over time (daily/weekly)
- **Device Breakdown**: Pie chart (Mobile vs Desktop vs Tablet)
- **Top QR Codes**: Ranked list by scan count
- **Geographic Distribution**: Table showing top cities/countries
- **Scan Heatmap**: Hourly heatmap showing peak scan times

---

## Phase 5: Subdomain Architecture (Documentation + Config)

Since this is a Vite SPA deployed on Lovable/Vercel, true wildcard subdomain routing requires DNS and server-side configuration that cannot be done purely in the frontend. The plan:

### 5.1 Tenant Resolver Middleware
- Update `CustomerMenu.tsx` to also accept a `slug` parameter: `/order?slug=hotel123`
- QR codes can generate URLs like `yourdomain.com/order?slug=hotel123&table=1`
- This achieves the same tenant isolation without needing wildcard DNS

### 5.2 For Future Subdomain Support
- Document the Nginx/Vercel wildcard configuration in a `DEPLOYMENT.md` file
- The app already resolves tenants by `restaurant_id`; adding slug-based resolution makes it subdomain-ready
- When deployed on a VPS with wildcard DNS, the same resolver logic applies

### 5.3 Update `vercel.json`
- No changes needed -- the existing SPA rewrite already handles all routes

---

## Phase 6: Security Enhancements

### 6.1 QR Link Signing (Dynamic QR)
- Dynamic QR redirect URLs include a short HMAC signature
- The `qr-redirect` edge function validates the signature before redirecting
- Prevents URL tampering on dynamic QR codes

### 6.2 Rate Limiting on Scan Endpoint
- Add basic rate limiting in the `qr-redirect` function (e.g., max 100 scans/minute per IP)
- Prevents scan count inflation attacks

---

## Files to Create

| File | Purpose |
|------|-------|
| `src/hooks/useQRCodes.ts` | CRUD hooks for qr_codes table |
| `src/components/admin/QRCodeManager.tsx` | Full QR management panel |
| `src/components/analytics/QRScanAnalytics.tsx` | Scan analytics dashboard |
| `supabase/functions/qr-redirect/index.ts` | Dynamic QR redirect + analytics logging |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/AdminDashboard.tsx` | Add QR Manager tab, scan analytics to dashboard |
| `src/components/admin/AdminSidebar.tsx` | Add "QR Manager" nav item |
| `src/pages/CustomerMenu.tsx` | Add slug-based tenant resolution |
| `supabase/config.toml` | Add qr-redirect function config |

## Database Migration

One migration with:
- CREATE TABLE qr_codes (with RLS policies)
- CREATE TABLE scan_analytics (with RLS policies)
- CREATE TABLE pages (with RLS policies)
- Enable realtime on qr_codes and scan_analytics

## Implementation Order

1. Database migration (3 new tables + RLS)
2. QR redirect edge function
3. useQRCodes hook
4. QRCodeManager component (admin panel)
5. QR Scan Analytics component
6. Wire into AdminDashboard and sidebar
7. Update CustomerMenu for slug-based resolution

