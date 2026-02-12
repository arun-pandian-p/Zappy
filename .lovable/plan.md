

# Fix: QR Code Not Scannable

## Root Causes

1. **Small render size (160px)**: The QR is generated at 160px which is too small for reliable scanning, especially when downloaded and printed.
2. **Broken SVG-to-PNG conversion**: The `btoa()` function used in the download fails on SVGs with non-ASCII/special characters, producing corrupted PNGs.
3. **Low-resolution download**: The canvas renders at 300x300 but upscales from 160px SVG, introducing blur that degrades scannability.
4. **Wrong base URL**: The QR encodes `window.location.origin` which is the Lovable preview URL, not the published app URL. Scanned QR codes point to a broken URL.

## Fixes

### 1. Use published URL as base
- Use the published URL (`https://qr-pal-maker.lovable.app`) as the default QR base URL instead of `window.location.origin`
- Store it in a constant or allow the admin to configure it in settings

### 2. Increase QR render size
- Change `QRCodeSVG` size from 160 to 256 for better visual clarity
- Add `includeMargin={true}` for the required quiet zone around QR codes (essential for scanners)

### 3. Fix download to use Canvas-based QR
- Switch from `QRCodeSVG` to `QRCodeCanvas` for the downloadable version (hidden)
- Use `canvas.toDataURL()` directly from the canvas element -- no SVG-to-PNG conversion needed
- Set download canvas size to 512x512 for print-quality output

### 4. Alternative: Fix the SVG download path
- Replace `btoa(svgData)` with `btoa(unescape(encodeURIComponent(svgData)))` to handle non-ASCII characters
- Increase canvas resolution to 512x512

## Technical Details

### File: `src/components/admin/QuickQRSection.tsx`

Changes:
- Import `QRCodeCanvas` alongside `QRCodeSVG` from `qrcode.react`
- Render a hidden `QRCodeCanvas` at 512px for downloads
- Update visible `QRCodeSVG` to size 256 with `includeMargin={true}`
- Fix `handleDownload` to grab the hidden canvas directly via `ref` and call `toDataURL()`
- Change default `baseUrl` to the published URL

### File: `src/pages/AdminDashboard.tsx`
- Pass the published URL as `baseUrl` prop to `QuickQRSection` (if the QR section is used there too)

## Implementation Order
1. Update `QuickQRSection.tsx` with all fixes
2. Verify QR renders at proper size with quiet zone margin
3. Test download produces a clean, scannable PNG
