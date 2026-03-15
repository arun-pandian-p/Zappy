

# Fix Logo Fallback & Branding Robustness

## Problem
1. **Logo shows alt text "manymore"** — The `<img>` tag in `CustomerTopBar` (line 89-95) and `QRSplashScreen` (line 64-71) have no `onError` handler. When the image URL fails to load (network issue, missing file, expired cache-bust URL), the browser shows the alt text instead of falling back gracefully.
2. **Banner image can also break** — Same issue on the banner `<img>` (line 62-66 in CustomerTopBar).

## Root Cause
No `onError` fallback on any `<img>` elements. When the storage URL is invalid or the file doesn't exist, the UI breaks visually.

## Changes

### 1. `src/components/menu/CustomerTopBar.tsx`
- Add `onError` handler to **logo img** — on error, hide the img and show the letter-initial fallback instead (using local state `logoFailed`)
- Add `onError` handler to **banner img** — hide the banner div if image fails
- This ensures broken images never show alt text

### 2. `src/components/branding/QRSplashScreen.tsx`
- Add `onError` handler to **splash logo img** — fall back to the letter-initial div when image fails to load
- Use local state `logoFailed` to toggle between img and fallback

### 3. `src/pages/CustomerMenu.tsx`
- No changes needed — the data flow (splashBranding pre-fetch + restaurant data) is correct. The issue is purely the missing `onError` handlers in the rendering components.

## Technical Detail
```typescript
// Pattern used in both components:
const [logoFailed, setLogoFailed] = useState(false);

{logoUrl && !logoFailed ? (
  <img src={logoUrl} onError={() => setLogoFailed(false)} ... />
) : (
  <div>{name.charAt(0)}</div>  // letter fallback
)}
```

This ensures the UI always shows either the real logo or a styled initial — never broken alt text.

