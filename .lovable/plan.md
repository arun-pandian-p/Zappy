

# Rebuild ZAPPY Logo — Pixel-Perfect SVG Matching Reference Image

## What Changes

The current SVG logo uses **stroked paths** and both P letters face the same direction. The reference image shows:
- **Filled (solid) letterforms** instead of strokes
- **First P is mirrored** (bowl opens LEFT), creating a face effect with the second P
- Wider, bolder letter shapes with rounded corners
- The smile is wider and positioned below both P bowls
- Eyes are inside the inward-facing bowls of both P's
- Overall heavier, more premium feel

This plan rebuilds the `ZappyLogo.tsx` component with filled SVG paths that exactly match the uploaded reference, then updates the favicon.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/branding/ZappyLogo.tsx` | Complete SVG path rebuild with filled shapes, mirrored first P, corrected proportions |
| `index.html` | Update favicon to use the SVG logo instead of `zappy-logo.jpg` |
| `public/favicon.svg` | Create new SVG favicon from the logo |

## Technical Details

### 1. Rebuild ZappyLogo.tsx SVG Paths

Replace all stroke-based letter paths with **filled paths**:

- **Z**: Bold filled Z with rounded corners, diagonal slash
- **A**: Filled A with triangular cutout, rounded top vertex
- **First P (mirrored)**: Vertical stem on RIGHT side, bowl opens LEFT — this is the critical difference from the current version
- **Second P (normal)**: Vertical stem on LEFT side, bowl opens RIGHT
- **Y**: Filled Y with arms splitting from center, vertical stem dropping down
- **Eyes**: Golden circles positioned inside the inward-facing bowls of each P
- **Smile**: Wider golden arc below the two P's, spanning about 60% of the logo width

Keep existing props API (`size`, `compact`, `showTagline`, `textColor`, `accentColor`, `animated`) unchanged so no other files need updating.

### 2. Create SVG Favicon

Create `public/favicon.svg` containing a compact version of the logo mark (just the two P's with eyes and smile, or the full wordmark scaled down).

### 3. Update index.html

Change favicon reference from `/zappy-logo.jpg` to `/favicon.svg` with proper type attribute.

## No Other File Changes Needed

All 8 files that import `ZappyLogo` already use the same component API, so they will automatically get the updated logo without any code changes.

