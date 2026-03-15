

## Plan: Add Close Buttons to All Ad Components + Verify Ad Data

### Problem
The FooterPromoAd and CategoryDividerAd components lack dismiss/close buttons. The HeaderBannerAd already has one. The ads are displaying but users cannot close them.

### Changes

**1. Add `onDismiss` to `FooterPromoAd`**
- Add an `onDismiss` prop and render an X close button (top-right of the banner)
- Style consistently with HeaderBannerAd's close button

**2. Add `onDismiss` to `CategoryDividerAd`**
- Add an `onDismiss` prop and render an X close button (right side)

**3. Update `CustomerMenu.tsx`**
- Add `footerAdDismissed` and `dividerAdDismissed` state variables
- Pass `onDismiss` callbacks to both ad components
- Conditionally hide dismissed ads

**4. Verify/Update ad data in database**
- Ensure the 3 ads (Zomato, Swiggy, Dunzo) exist with correct URLs:
  - Header Banner: Zomato Gold → `https://www.zomato.com`
  - Category Divider: Swiggy Instamart → `https://www.swiggy.com`  
  - Footer Banner: Dunzo Daily Deals → `https://www.dunzo.com`
- Update ad image URLs to use real web-sourced images via websearch

### Files Modified
- `src/components/menu/FooterPromoAd.tsx`
- `src/components/menu/CategoryDividerAd.tsx`
- `src/pages/CustomerMenu.tsx`
- Database: update ads table with proper image URLs

