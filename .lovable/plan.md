

# Fix Branding: Loading Screen, Customer Top Bar & Admin Theme

## Problems Identified

1. **Splash/Loading screen shows generic "R" / "Restaurant"** — The `QRSplashScreen` receives `restaurant?.name` and `restaurant?.logo_url`, but during the loading state (`restaurantLoading` is true), `restaurant` is still `null`. So it always falls back to the generic "R" letter and "Restaurant" text.

2. **Customer top bar banner missing** — The `CustomerTopBar` component has no banner/cover image support. It only shows logo + name + table badge.

3. **Theme not applying to customer menu** — The `TenantThemeProvider` is wrapping the customer menu but the splash screen renders *before* the restaurant data loads, so theme colors aren't applied during loading.

## Plan

### 1. Fix Splash Screen to Show Actual Restaurant Branding

**Problem**: The splash screen renders when `restaurantLoading` is true, meaning `restaurant` is null.

**Solution**: Restructure `CustomerMenu.tsx` so the splash screen is shown as an overlay *alongside* data fetching, not as an early return. This way once restaurant data arrives mid-splash, the logo and name update immediately.

**Changes in `src/pages/CustomerMenu.tsx`**:
- Remove the early return for loading state (lines 430-441)
- Instead, render `QRSplashScreen` as an overlay that shows while data is loading
- The splash auto-dismisses after data loads or 3s max (existing behavior)
- Pass restaurant data reactively so it updates as soon as available

### 2. Add Banner Image to Customer Top Bar

**Changes in `src/components/menu/CustomerTopBar.tsx`**:
- Add `bannerImageUrl` prop
- Add a collapsible banner section below the top bar that shows the restaurant's cover/banner image
- Banner collapses on scroll (using existing `isScrolled` state)

### 3. Fix Admin Theme Application

**Changes in `src/pages/AdminDashboard.tsx`**:
- Verify the `TenantThemeProvider` wrapping is correct and receives proper color values
- Currently the wrapper may be missing — need to check the full render. The theme provider was added previously but let me verify it's in the right place.

### 4. Ensure Splash Screen Uses Primary Color for Progress Bar

**Changes in `src/components/branding/QRSplashScreen.tsx`**:
- Apply `primaryColor` as inline style to progress indicator when available
- This ensures the loading bar matches the restaurant's brand even before CSS vars are set

## Files to Modify

1. `src/pages/CustomerMenu.tsx` — Restructure splash as overlay, pass banner to top bar
2. `src/components/menu/CustomerTopBar.tsx` — Add banner image support
3. `src/components/branding/QRSplashScreen.tsx` — Make it reactive to late-arriving data

