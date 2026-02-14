

# Add Tenant Profile Sync to Admin Sidebar and Header

## Overview

Enhance the admin sidebar footer and header to display the authenticated user's email, profile picture, and restaurant branding in a polished chip/badge layout.

---

## 1. Sidebar Footer -- Avatar + Name Chip with Restaurant Logo

**File**: `src/components/admin/AdminSidebar.tsx`

Current footer shows restaurant name and user email in plain text. Upgrade to:

- Show two distinct elements: a **restaurant logo** (small rounded icon) and a **user avatar** (from auth metadata or DiceBear seed)
- Add a name chip below the avatar with the user's display name (from `user.user_metadata.full_name` or email prefix) styled as a subtle badge
- When collapsed, show only the user avatar icon
- Layout: Restaurant logo on left, user info (name chip + email) on right

## 2. Admin Header -- User Email Badge

**File**: `src/components/admin/AdminHeader.tsx`

- Import `useAuth` hook to access the authenticated user's email
- Add a `Badge` component next to the avatar in the header's right section showing the user's email (e.g., `admin@hotel.com`)
- On mobile, truncate the email badge to just show the first part before `@`
- Style: `variant="secondary"` with a small user icon

## 3. Pass Additional Auth Data

**File**: `src/pages/AdminDashboard.tsx`

- Already passes `restaurantName` and `restaurantLogo` to sidebar -- no changes needed there
- Pass `userEmail` and `userDisplayName` to `AdminHeader` so it can render the email badge without needing its own `useAuth` call (though using the hook directly in the header is also fine)

---

## Technical Details

### AdminSidebar.tsx Changes

- Split footer into two rows: top row with restaurant logo + restaurant name, bottom row with user avatar + name chip + email
- User avatar uses `user.user_metadata.avatar_url` if available, falls back to DiceBear seeded by email
- Name chip extracts display name from `user.user_metadata.full_name` or derives it from the email prefix (e.g., `admin` from `admin@hotel.com`)
- Import `Badge` from `@/components/ui/badge`

### AdminHeader.tsx Changes

- Import `useAuth` from `@/hooks/useAuth`
- Import `Badge` from `@/components/ui/badge`
- Add `Mail` icon from `lucide-react`
- Render email badge between the settings icon button and the avatar: `<Badge variant="secondary" className="hidden sm:flex items-center gap-1"><Mail className="w-3 h-3" />{user?.email}</Badge>`
- On mobile (`sm:hidden`), show a truncated version or just the avatar

### Files Modified

| File | Changes |
|------|---------|
| `src/components/admin/AdminSidebar.tsx` | Redesign footer with restaurant logo + user avatar + name chip layout |
| `src/components/admin/AdminHeader.tsx` | Add authenticated user email badge, import useAuth and Badge |

### No New Files

All changes are modifications to existing components.

