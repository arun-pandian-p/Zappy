

# Replace ZAPPY Logo with Official SVG Across All Locations

## What Changes

You've provided the official ZAPPY logo SVG file (created in CorelDRAW) with the exact brand typography and design. This plan replaces the hand-drawn SVG paths in the current logo component with the actual official SVG file, and updates it everywhere: landing page navbar, footer, login page, and favicon.

## Approach

Since the official SVG contains precise vector paths from CorelDRAW that are far more accurate than hand-drawn approximations, we'll use the actual file directly.

## Changes

### 1. Copy SVG to Project
- Copy `user-uploads://zappy.svg` to `src/assets/zappy-logo.svg` (for React imports)
- Copy `user-uploads://zappy.svg` to `public/favicon.svg` (for favicon)

### 2. Rebuild ZappyLogo Component
Update `src/components/branding/ZappyLogo.tsx` to render the official SVG as an image element instead of inline SVG paths. The component will:
- Import the SVG from `src/assets/zappy-logo.svg`
- Render it as an `<img>` tag with proper sizing
- Keep existing props (`size`, `compact`, `className`) for layout control
- Remove the hand-drawn SVG paths entirely

### 3. Update Favicon in index.html
- Point favicon to the new `/favicon.svg`
- Already using SVG favicon format, just needs the correct file content

### 4. No Changes Needed in These Files
Since all these files already import and use `<ZappyLogo />`, they'll automatically get the updated logo:
- `src/pages/Login.tsx` (login page)
- `src/pages/LandingPage.tsx` (navbar)
- `src/components/landing/Footer.tsx` (footer)
- `src/components/admin/AdminSidebar.tsx`
- `src/components/superadmin/SuperAdminSidebar.tsx`
- `src/pages/ForgotPassword.tsx`
- `src/pages/ResetPassword.tsx`

## Technical Details

### File: `src/components/branding/ZappyLogo.tsx`
- Import SVG as module: `import zappyLogo from "@/assets/zappy-logo.svg"`
- Render as `<img src={zappyLogo} alt="ZAPPY" />` with height/width from props
- Simplified props: `size` controls height, `className` for custom styling
- The official SVG already contains the correct colors (#2E2755 purple, #FFD80E gold), eyes, smile, and tagline text

### File: `public/favicon.svg`
- Replace with the official SVG content (cropped to just the main logo mark area for better favicon rendering)

### File: `index.html`
- Verify favicon link points to `/favicon.svg` (already does)

## Result
Every location showing the ZAPPY logo will display the exact official brand SVG -- pixel-perfect at any size with no approximation.

