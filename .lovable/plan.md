

# Admin Login + Tenant Onboarding Wizard + Branding + Menu Theming

## Overview
This plan extends the admin login flow with a multi-step onboarding wizard for newly created restaurant admins (those with `restaurant_admin` role but no restaurant yet, or incomplete setup). It removes public signup, adds branding uploads, menu theme selection, and applies tenant branding to customer-facing menus.

**Important architectural note:** The PRD mentions per-tenant schema creation (`CREATE SCHEMA tenant_204`). This project already uses RLS-based multi-tenancy with `restaurant_id` filtering on shared tables, which is the correct approach for this architecture. Separate schemas would be a massive, unnecessary change. Instead, the "schema provisioning" step will seed default data (categories, sample menu items) for the new tenant within the existing shared tables.

---

## Phase 1: Database Migration

Add a `theme_config` JSONB column to the `restaurants` table to store theme presets and custom values:

```text
ALTER TABLE restaurants ADD COLUMN theme_config jsonb DEFAULT '{
  "preset": "classic",
  "custom_primary": null,
  "custom_secondary": null,
  "custom_font": null,
  "button_style": "rounded"
}'::jsonb;
```

Also add an `onboarding_completed` boolean column:

```text
ALTER TABLE restaurants ADD COLUMN onboarding_completed boolean DEFAULT false;
```

The `restaurants` table already has: `logo_url`, `favicon_url`, `banner_image_url`, `cover_image_url`, `primary_color`, `secondary_color`, `font_family`. These will be used for branding.

---

## Phase 2: Remove Public Signup

### 2a. TenantAdminLogin (`/admin/login`)
- Remove the Tabs component (Login / Sign Up toggle)
- Show only the login form
- Keep the staff role info section at the bottom
- Update description to: "Sign in with credentials provided by your platform admin"

### 2b. Staff Login (`/login`)
- Remove the Tabs component (Login / Sign Up toggle)
- Show only the login form
- Update description to: "Sign in with credentials provided by your restaurant admin"

---

## Phase 3: Onboarding Wizard Page

### New file: `src/pages/AdminOnboarding.tsx`
### New route: `/admin/onboarding`

A multi-step wizard with 5 steps:

**Step 1 - Hotel Details**
- Hotel name, address, phone, email, cuisine type
- Saves to `restaurants` table (updates the record created by Super Admin during `create-tenant`)

**Step 2 - Branding Upload**
- Logo upload (PNG/SVG, max 2MB) -> stored in `menu-images` bucket under `tenants/{restaurant_id}/`
- Favicon upload (ICO/PNG, 64x64) -> same bucket
- Menu banner upload -> same bucket
- Cover image upload -> same bucket
- Updates `logo_url`, `favicon_url`, `banner_image_url`, `cover_image_url` on the restaurant

**Step 3 - Menu UI Theme**
- Theme preset selector with preview cards:
  - Classic (warm white, orange accents)
  - Dark (dark bg, light text)
  - Premium (gold/black)
  - Minimal (clean white, thin borders)
  - Custom (shows color pickers)
- Custom fields when "Custom" selected: primary color, secondary color, font family, button style (rounded/square/pill)
- Saves to `restaurants.theme_config` and `restaurants.primary_color` / `secondary_color` / `font_family`

**Step 4 - Default Config Review**
- Shows the tax rates, currency, service charge inherited from platform defaults (applied during `create-tenant`)
- Admin can adjust if needed
- Saves to `restaurants.tax_rate`, `restaurants.service_charge_rate`, `restaurants.currency`

**Step 5 - Complete**
- Seeds 3 default categories (Starters, Main Course, Beverages) for the restaurant
- Sets `onboarding_completed = true`
- Shows success screen with links to:
  - "Go to Dashboard"
  - "Add Menu Items"
  - "Set Up Tables & QR"

### Progress indicator
- Stepper component at the top showing all 5 steps with current progress

---

## Phase 4: Auth Flow Update

### Update `useAuth.ts` - `getRouteForRole()`
- `restaurant_admin` with `restaurantId` AND `onboarding_completed = true` -> `/admin`
- `restaurant_admin` with `restaurantId` AND `onboarding_completed = false/null` -> `/admin/onboarding`
- `restaurant_admin` with NO `restaurantId` -> `/admin/onboarding` (edge case)

### Update `AdminDashboard.tsx`
- Add check: if `restaurant.onboarding_completed !== true`, redirect to `/admin/onboarding`

### Update `App.tsx`
- Add route: `/admin/onboarding` -> `AdminOnboarding`

---

## Phase 5: Branding Application in Customer Menu

### Update `CustomerMenu.tsx`
- Fetch `theme_config` from restaurant data
- Apply CSS variables based on preset or custom values:
  - `--primary-color`
  - `--secondary-color`
  - `--font-family`
- Show restaurant logo, banner, and cover image in the home view
- Apply font family from restaurant settings

### Theme preset mappings:
```text
classic:  primary=#F97316, secondary=#FDE68A, font=Inter
dark:     primary=#A78BFA, secondary=#6366F1, font=Inter
premium:  primary=#D4A574, secondary=#1A1A2E, font=Playfair Display
minimal:  primary=#374151, secondary=#E5E7EB, font=Inter
custom:   uses restaurant.primary_color / secondary_color / font_family
```

---

## Phase 6: Conditional Admin Sidebar

### Update `AdminSidebar.tsx`
- Accept `onboardingCompleted` prop
- Before onboarding: show only "Onboarding", "Settings (limited)", "Logout"
- After onboarding: show full nav (Dashboard, Menu, Tables, Orders, Kitchen, Billing, etc.)

---

## Phase 7: QR Generator Guard

### Update QR section in `AdminDashboard.tsx`
- If `onboarding_completed !== true`: show disabled state with message "Complete onboarding to enable QR codes"
- If no tables exist: show prompt to create tables first
- Otherwise: normal QR generation

---

## Files to Create
1. `src/pages/AdminOnboarding.tsx` - Multi-step onboarding wizard
2. `src/components/onboarding/OnboardingStep.tsx` - Reusable step wrapper
3. `src/components/onboarding/ThemePresetCard.tsx` - Theme preview card

## Files to Modify
1. `src/pages/TenantAdminLogin.tsx` - Remove signup tab, login only
2. `src/pages/Login.tsx` - Remove signup tab, login only
3. `src/pages/AdminDashboard.tsx` - Add onboarding redirect check
4. `src/components/admin/AdminSidebar.tsx` - Conditional nav based on onboarding status
5. `src/pages/CustomerMenu.tsx` - Apply tenant theme/branding
6. `src/hooks/useAuth.ts` - Update routing for onboarding flow
7. `src/App.tsx` - Add `/admin/onboarding` route

## Database Migrations
1. Add `theme_config` JSONB and `onboarding_completed` boolean to `restaurants`

## Implementation Order
1. Database migration (add columns)
2. Remove signup from login pages
3. Create onboarding wizard page + components
4. Update auth routing logic
5. Update AdminDashboard redirect
6. Update AdminSidebar conditional nav
7. Apply branding in CustomerMenu
8. QR generator guard

