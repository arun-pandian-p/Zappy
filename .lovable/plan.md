

## Plan: Fix Hero Watermark, Demo Link, and Add Zigzag Scroll Animation

### Issues Identified

1. **"QR Dine Pro" watermark visible in hero video** — The overlay gradient (95%/85%/100%) isn't fully covering the large watermark text in the video.
2. **"Invalid QR Code" on demo click** — `handleScanDemo` navigates to `/order?slug=qr&table=T1` but the only restaurant slug is `arun` (restaurant ID `b8b1bc0d-ed79-4ed4-a53c-6acccce6efa9`). Need to fix to use correct slug.
3. **Zigzag/bending road parallax scroll animation** — User wants the HowItWorks section to have a zigzag path animation where steps alternate left/right with a connecting SVG curved path, creating a "bending road" effect on scroll.

### Changes

#### 1. Fix Demo Link (`LandingPage.tsx`)
- Change `handleScanDemo` from `/order?slug=qr&table=T1` to `/order?slug=arun&table=T1` (matching actual restaurant slug).

#### 2. Strengthen Hero Video Overlay (`HeroSection.tsx`)
- Increase overlay opacity to fully mask the "QR Dine Pro" watermark: `from-foreground/98 via-foreground/92 to-foreground`.

#### 3. Rebuild HowItWorks with Zigzag Road Scroll Animation (`HowItWorks.tsx`)
- Replace the current two-column layout with a full-width zigzag timeline.
- Steps alternate left and right (odd steps left-aligned, even steps right-aligned).
- An SVG curved/serpentine path runs down the center connecting all steps — creating a "bending road" visual.
- Each step animates in with `whileInView` from its respective side (left steps slide from left, right from right).
- The SVG path draws itself using `useScroll` + `useTransform` on `pathLength` for a progressive reveal as user scrolls.
- Mobile: stack vertically with a simple straight connector line (zigzag doesn't work on small screens).
- Keep the video preview removed from this section (was sticky on right side before).

