

## Plan: Adaptive Logo for Light/Dark Backgrounds

### Problem
The ZAPPY logo is a JPG with a white background. On dark surfaces (sidebars, login page, super admin sidebar), the white rectangle clashes. On light surfaces (landing navbar, footer), it looks fine.

### Solution
Add a `variant` prop to `ZappyLogo` ("light" | "dark") that applies CSS filters to adapt the logo:
- **Light variant (default):** No filter needed — white bg blends naturally with light surfaces
- **Dark variant:** Apply `filter: invert(1) brightness(1.2)` to flip colors — white bg becomes transparent-looking on dark surfaces, text/eyes/smile become visible in light colors

### Files to Change

1. **`src/components/branding/ZappyLogo.tsx`** — Add `variant?: "light" | "dark"` prop. Apply `filter: invert(1)` + `brightness(1.2)` when variant is "dark". Also apply `mix-blend-mode: screen` to blend seamlessly into dark backgrounds.

2. **`src/pages/Login.tsx`** — Pass `variant="dark"` to both ZappyLogo instances (left panel is dark bg, mobile header is white so keep default there). The large logo on the dark left panel gets `variant="dark"`.

3. **`src/components/admin/AdminSidebar.tsx`** — Pass `variant="dark"` (sidebar bg is dark).

4. **`src/components/superadmin/SuperAdminSidebar.tsx`** — Pass `variant="dark"` (sidebar bg is dark).

5. **`src/components/landing/Footer.tsx`** — Keep as-is (light bg, no change needed).

6. **`src/pages/LandingPage.tsx`** — Keep as-is (white navbar, no change needed).

7. **`src/pages/ForgotPassword.tsx`** and **`src/pages/ResetPassword.tsx`** — Check bg color, likely light so keep default.

