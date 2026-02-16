

# Redesign All Login Pages -- Warm Split-Layout Style

Inspired by the reference images, all three login pages will be completely redesigned from the current dark slate glassmorphism to a warm, bright orange/amber split-layout with a white form card on the right side.

---

## New Design Direction

The current dark slate-950 theme will be replaced with a warm amber/orange background featuring:
- **Left side**: Themed illustration area with the brand name, decorative organic shapes, and role-specific SVG/CSS illustrations
- **Right side**: Clean white card with the login form, "Welcome Back" italic header, and role-specific accent colors

---

## Layout Structure (All 3 Pages)

```text
+----------------------------------------------------+
|  Orange/Amber background with organic blob shapes  |
|                                                     |
|  +------------------+   +----------------------+   |
|  |                  |   |   Welcome Back        |   |
|  |  Brand name      |   |                      |   |
|  |  "QR Dine"       |   |   [Email input]      |   |
|  |                  |   |   [Password input]    |   |
|  |  CSS illustration|   |                      |   |
|  |  (role-themed)   |   |   [Sign In button]   |   |
|  |                  |   |                      |   |
|  +------------------+   |   Back to Home link   |   |
|                         +----------------------+   |
+----------------------------------------------------+
```

---

## Per-Page Theming

### 1. Staff Portal (`/login`) -- Blue accent
- Left panel: Blue-tinted orange background, staff workspace illustration (CSS-based monitor + desk shapes)
- White card with blue "Sign In" button
- Subtitle: "Sign in to access staff operations"

### 2. Restaurant Admin (`/admin/login`) -- Orange accent
- Left panel: Full orange background, food/restaurant themed decorative elements (CSS leaf shapes, plate circles)
- White card with orange "Sign In" button
- Subtitle: "Sign in to manage your restaurant"

### 3. Super Admin (`/super-admin/login`) -- Indigo accent
- Left panel: Indigo-tinted background, command center themed shapes (CSS geometric patterns)
- White card with indigo "Sign In" button
- Subtitle: "Sign in to the platform console"
- Keeps the "restricted area" warning and "Restaurant Admin Login" link

---

## UI Elements on the White Card

- **"Welcome Back"** in italic cursive style (matching reference)
- **Email input** with light gray background, user icon placeholder
- **Password input** with eye toggle, key icon placeholder
- **Rounded pill "Sign In" button** in the portal's accent color
- **"Back to Home"** link at the bottom

---

## Technical Details

### Files Modified
- `src/pages/Login.tsx` -- Full rewrite of JSX/styling
- `src/pages/TenantAdminLogin.tsx` -- Full rewrite of JSX/styling
- `src/pages/SuperAdminLogin.tsx` -- Full rewrite of JSX/styling

### Key Changes
- Background: `bg-amber-500` / `bg-orange-500` replacing `bg-slate-950`
- Form card: `bg-white rounded-3xl shadow-2xl` replacing `bg-white/5 backdrop-blur`
- Inputs: `bg-gray-100 border-0` light gray style replacing dark transparent inputs
- Text: Dark text (`text-gray-800`) on white card replacing white-on-dark
- Left panel uses CSS-only decorative shapes (circles, blobs) -- no external images
- Framer Motion animations kept for entrance effects
- All authentication logic (useAuth, signIn, redirect) remains unchanged
- Feature cards on left panel replaced with simpler decorative illustration area
- Remove unused `Avatar` imports since the form header switches to text-only cursive style

### No New Dependencies
Pure CSS/Tailwind styling changes only.

