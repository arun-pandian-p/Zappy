

# Fix ZAPPY Logo Size Across All Locations

## Problem
The official ZAPPY SVG has a very tall portrait viewBox (8263 x 11680), meaning the actual logo text and mascot occupy only a portion of the canvas. When rendered at small heights like 32-36px, the visible content becomes tiny and hard to read.

## Solution
Increase the logo `size` prop at every usage point to make it properly visible, and update the favicon.

## Changes

### 1. Landing Page Navbar (`src/pages/LandingPage.tsx`)
- Change `<ZappyLogo size={36} compact />` to `<ZappyLogo size={56} compact />`

### 2. Footer (`src/components/landing/Footer.tsx`)
- Change `<ZappyLogo size={36} compact />` to `<ZappyLogo size={56} compact />`

### 3. Login Page (`src/pages/Login.tsx`)
- Left panel: Change `size={64}` to `size={100}`
- Mobile fallback: Change `size={40}` to `size={64}`

### 4. Forgot Password (`src/pages/ForgotPassword.tsx`)
- Change `size={40}` to `size={64}`

### 5. Reset Password (`src/pages/ResetPassword.tsx`)
- Change `size={40}` to `size={64}`

### 6. Admin Sidebar (`src/components/admin/AdminSidebar.tsx`)
- Change `size={32}` to `size={48}`

### 7. Super Admin Sidebar (`src/components/superadmin/SuperAdminSidebar.tsx`)
- Change `size={32}` to `size={48}`

### 8. Favicon (`public/favicon.svg`)
- Update the favicon SVG to crop the viewBox to just the logo mark area (the face with eyes and smile) so it renders clearly at small favicon sizes (16x16, 32x32)

### 9. Footer copyright text
- Update "QR Dine Pro" to "ZAPPY" in the copyright line if still present

## Technical Notes
- The `compact` prop applies a 0.8x multiplier to size, so the actual rendered heights will be slightly smaller than the prop values
- No changes needed to the `ZappyLogo` component itself -- just the size values passed to it
- All 7 files that use the logo will be updated in parallel

