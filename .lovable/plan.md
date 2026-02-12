
# Super Admin Complete Overhaul: Tenant Management, User Management, Settings, and Real-Time Sync

## Overview
This plan implements the full PRD for the Super Admin panel, including an expanded sidebar, a "Create Hotel" flow with auto-provisioning (edge function), platform settings with new DB tables, system logs, and real-time synchronization across all dashboards.

---

## Phase 1: Database Migrations

### New Tables

1. **`platform_settings`** (single-row config table)
   - `id` uuid PK, `platform_name` text, `logo_url` text, `favicon_url` text, `primary_color` text, `secondary_color` text, `email_logo_url` text, `login_bg_url` text, `updated_at` timestamptz
   - RLS: Only `super_admin` can read/write

2. **`default_tax_settings`** (single-row defaults for new tenants)
   - `id` uuid PK, `gst_percent` numeric, `service_charge_percent` numeric, `vat_percent` numeric, `tax_mode` text (inclusive/exclusive), `currency` text, `updated_at` timestamptz
   - RLS: Only `super_admin` can read/write

3. **`email_templates`**
   - `id` uuid PK, `template_name` text, `subject` text, `body_html` text, `variables_json` jsonb, `created_at` timestamptz, `updated_at` timestamptz
   - RLS: Only `super_admin` can CRUD
   - Seed 5 default templates: admin_credentials, staff_invite, subscription_invoice, password_reset, trial_expiry

4. **`system_logs`**
   - `id` uuid PK, `actor_id` uuid, `actor_email` text, `action` text, `entity_type` text, `entity_id` text, `details` jsonb, `created_at` timestamptz
   - RLS: Only `super_admin` can SELECT
   - INSERT via edge functions (service role)

### Realtime
- Add `restaurants`, `staff_profiles`, `user_roles`, `system_logs` to `supabase_realtime` publication (staff_profiles and user_roles already added in previous migration, so only restaurants and system_logs needed).

---

## Phase 2: Edge Function - `create-tenant`

A new edge function `supabase/functions/create-tenant/index.ts` that:

1. Validates caller is `super_admin`
2. Creates the restaurant record in `restaurants` table
3. Auto-generates username (`slug_admin`) and password (12-char random)
4. Creates auth user via `adminClient.auth.admin.createUser()` with `email_confirm: true`
5. Inserts `user_roles` (role: `restaurant_admin`, restaurant_id)
6. Inserts `staff_profiles`
7. Copies default tax settings to the new restaurant's `tax_rate` and `service_charge_rate`
8. Logs action to `system_logs`
9. Returns credentials (email, generated password, login URL)

Config: `verify_jwt = false` in `supabase/config.toml`

---

## Phase 3: Update `manage-staff` Edge Function

Modify to support `restaurant_admin` role creation when caller is `super_admin`:
- Currently blocks all admin role creation. Change to: if caller is `super_admin`, allow creating `restaurant_admin` roles (but not `super_admin`).
- Accept optional `restaurant_id` parameter from super_admin callers.
- Log staff creation to `system_logs`.

---

## Phase 4: Super Admin Sidebar Expansion

Update `SuperAdminSidebar.tsx` nav items to the final layout:

| Icon | Label | Value |
|------|-------|-------|
| LayoutDashboard | Dashboard | dashboard |
| Building2 | Tenants / Hotels | restaurants |
| Users | User Management | users |
| CreditCard | Subscription Plans | plans |
| Megaphone | Platform Ads | ads |
| BarChart3 | Analytics | analytics |
| Settings | Settings | settings |
| ScrollText | System Logs | logs |

---

## Phase 5: Super Admin Dashboard Content Sections

### 5a. Tenants / Hotels (Enhanced)
- Replace the simple "Add Restaurant" form with a full **Create Hotel** dialog/panel:
  - Restaurant info: name, branch count (text field), cuisine type, address, phone, email
  - Branding: logo upload (to `menu-images` bucket), theme color picker
  - Admin credentials: admin email (required), auto-generated username shown, auto-generated password shown with copy button
  - On submit: calls `create-tenant` edge function
  - Success: shows credentials card with copy-all button
- Keep existing TenantTable with edit/delete/toggle

### 5b. User Management (Enhanced)
- Add a **restaurant selector dropdown** at the top (for super_admin to pick a restaurant context)
- Show "All Restaurants" option that lists all staff globally
- When a restaurant is selected, allow creating staff scoped to that restaurant
- For super_admin: allow creating `restaurant_admin` role (calls updated `manage-staff` edge function)
- Auto-generate password with a "Generate" button

### 5c. Subscription Plans
- New component `SubscriptionPlansManager.tsx`
- CRUD on `subscription_plans` table
- Fields: name, tier, price_monthly, price_yearly, max_tables, max_orders_per_month, features (JSON editor or checkboxes), is_active

### 5d. Platform Ads
- New component `PlatformAdsManager.tsx`
- CRUD on `ads` table (already exists)
- Fields: title, description, image_url (upload), link_url, target categories, date range, is_active

### 5e. Settings (3 sub-tabs)
- **Platform Branding**: reads/writes `platform_settings`
- **Default Tax Config**: reads/writes `default_tax_settings`
- **Email Templates**: reads/writes `email_templates` with variable preview

### 5f. System Logs
- New component `SystemLogs.tsx`
- Read-only table from `system_logs`
- Columns: timestamp, actor email, action, entity, details
- Search/filter by action type
- Real-time subscription for live updates

---

## Phase 6: Real-Time Subscriptions

Add Supabase realtime listeners in `SuperAdminDashboard.tsx`:

```text
Channel: 'super-admin-realtime'
Tables: restaurants, staff_profiles, user_roles, system_logs
On change: invalidate relevant react-query keys
```

This ensures:
- New tenant created -> dashboard count updates instantly
- Staff added/removed -> user management refreshes
- Logs appear in real-time

---

## Phase 7: Hooks

### New hooks:
- `usePlatformSettings()` - CRUD for platform_settings
- `useDefaultTaxSettings()` - CRUD for default_tax_settings  
- `useEmailTemplates()` - CRUD for email_templates
- `useSubscriptionPlans()` - CRUD for subscription_plans (already have table)
- `useSystemLogs()` - read-only for system_logs
- `usePlatformAds()` - CRUD for ads table (extend existing useAds)

---

## Phase 8: Login Flow Validation

Ensure `useAuth.ts` routes correctly:
- `super_admin` -> `/super-admin` (already works)
- `restaurant_admin` -> `/admin` (already works)  
- `kitchen_staff` -> `/kitchen` (already works)
- `billing_staff` -> `/billing` (already works)

No public signup - the Login and TenantAdminLogin pages only show login forms (no signup option). Verify this is the case.

---

## Files to Create
1. `supabase/functions/create-tenant/index.ts`
2. `src/components/superadmin/CreateHotelForm.tsx`
3. `src/components/superadmin/SubscriptionPlansManager.tsx`
4. `src/components/superadmin/PlatformAdsManager.tsx`
5. `src/components/superadmin/PlatformSettings.tsx`
6. `src/components/superadmin/DefaultTaxSettings.tsx`
7. `src/components/superadmin/EmailTemplateManager.tsx`
8. `src/components/superadmin/SystemLogs.tsx`
9. `src/hooks/usePlatformSettings.ts`
10. `src/hooks/useDefaultTaxSettings.ts`
11. `src/hooks/useEmailTemplates.ts`
12. `src/hooks/useSubscriptionPlans.ts`
13. `src/hooks/useSystemLogs.ts`

## Files to Modify
1. `supabase/functions/manage-staff/index.ts` - Allow super_admin to create restaurant_admin
2. `supabase/config.toml` - Add create-tenant function config
3. `src/components/superadmin/SuperAdminSidebar.tsx` - 8-item nav
4. `src/pages/SuperAdminDashboard.tsx` - All new sections + realtime
5. `src/components/admin/UserManagement.tsx` - Restaurant selector for super_admin

## Database Migrations
1. Create `platform_settings`, `default_tax_settings`, `email_templates`, `system_logs` tables with RLS
2. Seed default email templates
3. Add new tables to realtime publication

---

## Implementation Order
1. Database migrations (tables + RLS + seeds + realtime)
2. `create-tenant` edge function
3. Update `manage-staff` edge function
4. New hooks
5. New UI components
6. Update sidebar + dashboard
7. End-to-end testing
