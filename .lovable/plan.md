

# Redesign All Login Pages with Dark Glassmorphism Split Layout

Redesign all three login pages (`/login`, `/admin/login`, `/super-admin/login`) to use a consistent dark, glassmorphism-based split layout inspired by the reference image: login form on the left, feature/role showcase on the right, with a deep dark background and glass card surfaces.

---

## Layout Structure (All Three Pages)

Each login page will follow a two-column split layout:

- **Left panel**: Glass card containing the icon, title, subtitle, email/password form, sign-in button, and back link
- **Right panel**: Bold headline, descriptive paragraph, and 3 glass feature cards with colored icon badges
- **Background**: Dark gradient (`slate-950` to `slate-900`) with a subtle grid overlay and ambient glow effects
- **Mobile**: Stacks vertically (form on top, features below)

---

## Page-Specific Adaptations

### 1. Staff Portal (`/login`)
- Icon: LogIn (blue gradient badge)
- Title: "Staff Portal"
- Subtitle: "Secure access for restaurant staff operations"
- Right headline: "Smart Staff Workspace"
- Right description: "Role-based access for seamless restaurant operations from kitchen to billing -- all synchronized in real time."
- Feature cards: Admin Control (blue, Shield), Kitchen Display (orange, ChefHat), Billing POS (green, Receipt)

### 2. Restaurant Admin Portal (`/admin/login`)
- Icon: UtensilsCrossed (orange/amber gradient badge)
- Title: "Restaurant Admin"
- Subtitle: "Manage your restaurant operations"
- Right headline: "Complete Restaurant Control"
- Right description: "Full management suite for menu, orders, staff, and analytics -- everything in one place."
- Feature cards: Menu Manager (orange), Order Tracking (blue), Analytics (purple)

### 3. Super Admin Portal (`/super-admin/login`)
- Icon: Shield (indigo/purple gradient badge)
- Title: "Super Admin Portal"
- Subtitle: "Platform Management Console Access"
- Right headline: "Platform Command Center"
- Right description: "Manage all tenants, monitor platform health, and control system-wide settings."
- Feature cards: Tenant Management (blue), System Monitoring (amber), Platform Config (emerald)

---

## Technical Details

### Files Modified
- `src/pages/Login.tsx` -- Full redesign with split layout
- `src/pages/TenantAdminLogin.tsx` -- Full redesign with split layout
- `src/pages/SuperAdminLogin.tsx` -- Full redesign with split layout

### Shared Styling Patterns
- Background: `bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950`
- Grid overlay: subtle CSS grid lines with low-opacity white
- Ambient glow: absolute positioned blurred circles with color matching the portal theme
- Glass card: `bg-white/5 backdrop-blur-xl border border-white/10` (using existing `glass-card` utility where appropriate)
- Inputs: dark background (`bg-white/5 border-white/10 text-white`)
- Sign-in button: gradient matching each portal's accent color
- Feature cards on the right: `bg-white/5 border border-white/10` with rounded colored icon badges
- Framer Motion entrance animations (stagger for right-side cards)

### No New Dependencies
All changes use existing libraries (framer-motion, lucide-react, shadcn components, Tailwind).

