
# Admin Onboarding Redesign + Customer Menu Control + Security Fixes

This plan covers three areas: (1) redesigning the onboarding wizard UI to match the dark glassmorphism style used in login pages, (2) adding customer menu customization controls during onboarding, and (3) fixing all outstanding security issues.

---

## 1. Onboarding UI Redesign

Redesign `/admin/onboarding` to use the same dark glassmorphism split-layout aesthetic as the login pages.

**Changes to `src/pages/AdminOnboarding.tsx`:**
- Dark gradient background (`slate-950` to `slate-900`) with grid overlay and ambient glow
- Glass card containers (`bg-white/5 backdrop-blur-xl border-white/10`) for each step
- Stepper bar with glowing active indicators on dark surface
- Improved typography with white/light text for dark theme
- Framer Motion entrance animations for each step transition
- Add input validation (hotel name required, email format, phone format)

---

## 2. Customer Menu Control (New Step 3)

Insert a new **"Menu Display"** step between Branding and Configuration (making it a 6-step wizard) that lets admins control how the customer-facing menu looks and behaves.

**New step fields:**
- **Menu Title** -- custom heading shown on customer menu (uses existing `menu_title` column)
- **Default View Mode** -- toggle between Grid (2-column cards) or List view as default for customers
- **Show Offers Slider** -- toggle to enable/disable the offers carousel on the menu
- **Show Veg/Non-veg Badges** -- toggle for dietary indicator badges on food cards
- **Card Style** -- choose between Compact, Standard, or Detailed food card density

These preferences will be stored in the restaurant's `settings` JSONB column under a `menu_display` key, so no new database tables are needed.

**Updated steps array:**
1. Hotel Details
2. Branding
3. Menu Theme (colors/fonts)
4. Menu Display (NEW -- customer menu controls)
5. Configuration (tax/currency)
6. Complete

---

## 3. Security Fixes

### 3a. Shopify Token Finding -- Delete
The Shopify integration was already removed. Delete this resolved finding.

### 3b. Email Template XSS Fix
**File: `src/components/superadmin/EmailTemplateManager.tsx`**
- Install `dompurify` package
- Sanitize `body_html` before rendering with `dangerouslySetInnerHTML`
- Restrict allowed tags to safe email HTML elements

### 3c. Firecrawl Edge Functions -- Proper JWT Validation
**Files: `supabase/functions/firecrawl-scrape/index.ts` and `supabase/functions/firecrawl-search/index.ts`**
- Replace simple auth header presence check with actual JWT validation using Supabase client
- Verify user exists and has `super_admin` or `restaurant_admin` role
- Return 401/403 for invalid/unauthorized requests

### 3d. System Logs -- Explicit Deny INSERT Policy
**Database migration:**
- Add explicit INSERT policy `WITH CHECK (false)` to block direct inserts
- Edge functions using service role key will still bypass RLS

### 3e. QR Scan Count -- Revoke Public Execute
**Database migration:**
- Revoke EXECUTE on `increment_scan_count` from `public`, `anon`, and `authenticated` roles
- Add validation that QR code is active before incrementing
- Edge function (service role) still works since it bypasses permissions

### 3f. QR Redirect -- URL Validation
**File: `supabase/functions/qr-redirect/index.ts`**
- Add URL scheme validation to only allow `http:` and `https:` protocols
- Return 400 error for invalid/malicious URLs
- The `resolveTargetUrl` function already handles relative URLs

### 3g. Feedback Table -- Remove Public Read
**Database migration:**
- The feedback table currently has no public SELECT policy (only staff can read via `restaurant_id = get_user_restaurant_id(auth.uid())`), but the INSERT policy doesn't restrict reading customer PII
- Verify and confirm the existing policies are correctly restrictive (they already are -- only staff can SELECT)

### 3h. Order Items Anonymous Read -- Mark as Acceptable
- This is by design: customers need to see their order items without authentication (QR-based ordering)
- Update the finding to mark it as ignored with reason

---

## Technical Summary

| Area | Files Modified |
|------|---------------|
| Onboarding UI | `src/pages/AdminOnboarding.tsx` |
| Menu Display Controls | `src/pages/AdminOnboarding.tsx`, `src/pages/CustomerMenu.tsx` |
| Email XSS Fix | `src/components/superadmin/EmailTemplateManager.tsx` |
| Firecrawl Auth | `supabase/functions/firecrawl-scrape/index.ts`, `supabase/functions/firecrawl-search/index.ts` |
| QR Redirect Validation | `supabase/functions/qr-redirect/index.ts` |
| DB Migrations | System logs INSERT deny, scan count function hardening |
| Security Findings | Delete resolved, ignore by-design, fix actionable |
| New Dependency | `dompurify` (for HTML sanitization) |
