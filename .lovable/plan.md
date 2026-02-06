
# Complete Implementation Plan

## Overview

Based on the uploaded screenshots and request, I will implement the following:

1. **Create QR-themed favicon/logo** - Replace the current placeholder with a custom QR code-styled logo
2. **Fix the Ads "Cannot coerce JSON" error** - The error occurs when updating ads without proper restaurant_id filtering
3. **Implement Timer Functions** - Add table session timers in Admin Dashboard and Customer Menu (like the "Waiting Timer" in the mockup)
4. **Update Admin/Super Admin UI** - Match reference designs with proper QR logo branding

---

## Problem Analysis

### Issue 1: Favicon Missing
The current `index.html` has no favicon link. The default Lovable favicon.ico exists but isn't referenced.

### Issue 2: Ads Error
The error "Cannot coerce the result to a single JSON object" occurs in `useAds.ts` when:
- The `ads` table doesn't have `restaurant_id` column (it's a global table)
- When updating/creating, the `.select().single()` fails if multiple rows match

The `ads` table schema shows NO `restaurant_id` - it's a platform-wide table. The update uses `.eq("id", id).select().single()` which should work, but the error suggests there might be duplicate IDs or the ad was deleted. We need to add proper error handling and make ads restaurant-scoped.

### Issue 3: Missing Timer UI
The reference mockup shows a "Waiting Timer" card displaying:
- Order status ("Your Order #145 is being prepared")
- Animated timer (5:15)
- Estimated wait time (8-12 mins)
- "View Order" button

This is NOT implemented in the current CustomerMenu.

---

## Implementation Details

### Phase 1: Create QR Logo & Favicon

**Files to create:**
- `public/qr-logo.svg` - Custom QR-themed logo SVG

**Files to update:**
- `index.html` - Add favicon link and update title
- `src/components/admin/AdminSidebar.tsx` - Use new logo
- `src/pages/SuperAdminDashboard.tsx` - Use new logo in header

**Logo Design:**
A modern QR code icon with the letters "QR" integrated, using the primary brand color.

---

### Phase 2: Fix Ads System

**Files to update:**
- `src/hooks/useAds.ts` - Add restaurant_id filtering, improve error handling

**Database migration:**
- Add `restaurant_id` column to `ads` table (optional)
- For now, fix error handling to not crash on edge cases

**Changes:**
```typescript
// useAds.ts - Remove .single() from update to prevent error
export function useUpdateAd() {
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from("ads")
        .update(updates)
        .eq("id", id)
        .select();  // Remove .single() to handle edge cases

      if (error) throw error;
      return data?.[0] || null;  // Return first result
    },
    // ...
  });
}
```

---

### Phase 3: Implement Waiting Timer Component

**Files to create:**
- `src/components/order/WaitingTimer.tsx` - Animated timer card

**Files to update:**
- `src/pages/CustomerMenu.tsx` - Show timer when order is in progress

**WaitingTimer Features:**
- Show order number and current status
- Animated circular timer with elapsed time
- Estimated wait time based on prep_time_minutes from menu items
- Pulsing animation when preparing
- "View Order" button to see details

---

### Phase 4: Admin Dashboard Timer Section

**Files to create:**
- `src/components/admin/TableSessionTimers.tsx` - Display active session timers

**Files to update:**
- `src/pages/AdminDashboard.tsx` - Add timer section in dashboard tab

**Timer Display:**
- Show all active table sessions
- Display timers: Wait Time | Prep Time | Service Time
- Color-code based on duration (green < 5m, yellow < 10m, red > 10m)
- Real-time updates every 30 seconds

---

### Phase 5: Super Admin Timer Analytics

**Files to update:**
- `src/pages/SuperAdminDashboard.tsx` - Add average timer metrics
- `src/components/superadmin/TenantStats.tsx` - Add timer stat card

**Metrics to show:**
- Average wait time across all restaurants
- Average prep time
- Restaurants with slowest service

---

## File Changes Summary

### New Files
| File | Purpose |
|------|---------|
| `public/qr-logo.svg` | Brand logo SVG |
| `src/components/order/WaitingTimer.tsx` | Customer waiting timer card |
| `src/components/admin/TableSessionTimers.tsx` | Admin timer display |

### Files to Update
| File | Changes |
|------|---------|
| `index.html` | Add favicon, update title/meta |
| `src/hooks/useAds.ts` | Fix JSON coerce error |
| `src/components/admin/AdminSidebar.tsx` | Use new logo |
| `src/pages/SuperAdminDashboard.tsx` | Use new logo, add timer stats |
| `src/pages/CustomerMenu.tsx` | Add WaitingTimer component |
| `src/pages/AdminDashboard.tsx` | Add table session timers |

---

## Technical Details

### WaitingTimer Component

```text
Props:
- order: OrderWithItems
- estimatedMinutes: number (from prep_time_minutes sum)

State:
- elapsedTime: number (calculated from order.created_at)
- refreshInterval: 1000ms

Visual:
- Circular progress indicator
- MM:SS elapsed time display
- Status text with order number
- Pulsing animation effect
```

### TableSessionTimers Component

```text
Props:
- restaurantId: string
- sessions: TableSessionWithTable[]

Display:
- Table grid showing each active session
- Timer columns: Wait | Prep | Service | Total
- Color-coded cells based on duration
- Auto-refresh every 30 seconds
```

### Logo SVG Design

```svg
<!-- QR-themed logo with grid pattern -->
<svg viewBox="0 0 40 40">
  <!-- QR code corner patterns -->
  <!-- Central "QR" text or icon -->
  <!-- Brand primary color #3b82f6 -->
</svg>
```

---

## Implementation Order

1. Create QR logo SVG and update favicon
2. Fix ads error in useAds.ts
3. Create WaitingTimer component
4. Integrate WaitingTimer into CustomerMenu
5. Create TableSessionTimers component
6. Add timers to AdminDashboard
7. Add timer metrics to SuperAdminDashboard

---

## Success Criteria

After implementation:
- Browser tab shows QR-themed favicon
- Admin sidebar displays branded QR logo
- Ads create/edit works without JSON errors
- Customer sees animated waiting timer after placing order
- Admin dashboard shows table session timers
- Super Admin sees average timer metrics
