

# Fix: Admin Preview UI and Published Site Sync

## Problems Identified

**Image 1 (Admin Preview):** The customer menu preview in the iframe shows the offers slider and categories, but food cards are not visible below. The iframe content is scrollable but the cards appear to be rendering below the visible area. The preview itself is working with the correct compact UI.

**Image 2 (Published Site):** The published site at `qr-pal-maker.lovable.app` shows a completely **outdated version** of the code -- large full-width cards, no offers slider, a different header layout. This is because the latest code changes have not been published yet. You need to click the **Publish** button to push the new compact grid cards, offers slider, and real-time sync features to the live site.

## Changes Required

### 1. Fix Admin Preview Iframe Scrolling
The iframe height is constrained to `maxHeight: 70vh` which cuts off content. The food cards render below the fold but the iframe container doesn't allow proper scrolling.

**File: `src/pages/AdminDashboard.tsx`**
- Remove `maxHeight: '70vh'` constraint from the iframe wrapper for mobile/tablet devices
- Instead, set a fixed pixel height matching the device (e.g., 812px for mobile) and let the iframe scroll naturally within it
- Increase the outer container `minHeight` so the preview device frame has room

### 2. Publish the App
The published site is running old code. After these fixes are implemented, you must **click Publish** to deploy the latest version with:
- Compact 3:2 grid food cards
- Offers slider with auto-scroll
- Real-time sync for logo/branding/menu changes
- Branded customer top bar with animations

---

## Technical Details

### AdminDashboard.tsx iframe fix (line ~145):

Current code:
```text
style={device !== "desktop" 
  ? { width: deviceConfig[device].width, height: deviceConfig[device].height, maxHeight: '70vh' } 
  : { height: '70vh' }}
```

Change to:
```text
style={device !== "desktop" 
  ? { width: deviceConfig[device].width, height: deviceConfig[device].height } 
  : { height: '80vh' }}
```

Also update the outer container from `minHeight: '75vh'` to `minHeight: '85vh'` to give the device frame enough room to display at full height without clipping.

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/AdminDashboard.tsx` | Remove `maxHeight: '70vh'` on iframe wrapper, increase container height |

### Post-Implementation
After the fix, click **Publish** to deploy all changes to the live site.

