
# Replace Icons with Avatar Components on All Login Pages

Transform all three login pages to use Avatar components with themed emoji/icon fallbacks instead of plain Lucide icons, inspired by the reference image showing avatar-style circular portraits. Each page will have a unique personality.

---

## Changes Overview

### What Changes
Replace the square icon badges (both on the left form header and right feature cards) with circular Avatar components using the existing `Avatar`, `AvatarImage`, and `AvatarFallback` from `src/components/ui/avatar.tsx`. Since we cannot use real photographs, each avatar will use a large themed emoji as the fallback content inside a glowing ring border that matches the portal's color theme.

### Left Panel -- Hero Avatar
- Replace the 16x16 square icon badge with a large (24x24) circular Avatar with a glowing ring border
- Each portal gets a unique emoji character as fallback
- Title changes to "Welcome Back!" with role-specific subtitle (matching the reference)

### Right Panel -- Feature Card Avatars
- Replace the 10x10 square icon badges with 12x12 circular Avatars
- Each feature card gets its own themed emoji representing the role

---

## Per-Page Customization

### 1. Staff Portal (`/login`) -- Blue Theme
- **Hero avatar**: Ring border `ring-blue-500/50`, emoji fallback: office worker emoji, glow `shadow-blue-500/30`
- **Title**: "Welcome Back!" / "Sign in to access staff operations"
- **Feature avatars**:
  - Admin Control: shield emoji
  - Kitchen Display: cook emoji  
  - Billing POS: receipt emoji

### 2. Restaurant Admin (`/admin/login`) -- Orange Theme
- **Hero avatar**: Ring border `ring-orange-500/50`, emoji fallback: chef emoji, glow `shadow-orange-500/30`
- **Title**: "Welcome Back!" / "Sign in to manage your restaurant"
- **Feature avatars**:
  - Menu Manager: fork-and-knife emoji
  - Order Tracking: clipboard emoji
  - Analytics: chart emoji

### 3. Super Admin (`/super-admin/login`) -- Indigo Theme
- **Hero avatar**: Ring border `ring-indigo-500/50`, emoji fallback: technologist emoji, glow `shadow-indigo-500/30`
- **Title**: "Welcome Back!" / "Sign in to the platform console"
- **Feature avatars**:
  - Tenant Management: building emoji
  - System Monitoring: satellite emoji
  - Platform Config: gear emoji

---

## Technical Details

### Files Modified
- `src/pages/Login.tsx`
- `src/pages/TenantAdminLogin.tsx`
- `src/pages/SuperAdminLogin.tsx`

### Implementation Pattern

The hero avatar section (replacing the square icon) will look like:

```text
+----------------------------------+
|         (large avatar)           |
|     glowing ring + emoji         |
|                                  |
|       "Welcome Back!"           |
|   "Sign in to manage your..."   |
+----------------------------------+
```

Feature card avatars will use smaller Avatar components with gradient ring borders matching each card's color theme, replacing the current square gradient icon boxes.

### New Imports (per file)
- `Avatar`, `AvatarFallback` from `@/components/ui/avatar`

### Removed Imports
- Unused Lucide icons that were previously used for the badges (LogIn, Shield, etc. where no longer needed)
- Feature card data will store an `emoji` string instead of an `icon` component reference

### No New Dependencies
Uses the existing Avatar component from shadcn/ui already installed in the project.
