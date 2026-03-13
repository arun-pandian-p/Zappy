

# Parallax Scroll Implementation for Landing Page

## Overview
Add parallax scrolling effects across the landing page sections using Framer Motion's `useScroll` and `useTransform` hooks, which are already in the project. This creates depth and visual polish as users scroll.

## What Changes

### 1. Hero Section (already partially done)
The video already has parallax scale/opacity. Add parallax to the left content (text moves slightly slower than scroll) for a layered depth effect.

### 2. New `ParallaxSection` wrapper component
Create a reusable wrapper that applies configurable parallax effects (vertical offset, opacity fade, scale) to any child section. This avoids duplicating scroll logic across every section file.

### 3. Apply parallax to landing page sections
Wrap key sections in `LandingPage.tsx` with the parallax wrapper:

- **LiveDashboardTeaser** -- subtle upward float on scroll
- **FeaturesSection** -- staggered card entrance with slight Y-offset parallax
- **ProductDemo** -- scale-up reveal as it enters viewport
- **HowItWorks** -- each step card has a slight vertical offset parallax
- **DashboardCarousel** -- gentle parallax background shift
- **PricingSection** -- cards float up at different rates
- **CTABanner** -- background image moves slower than content (classic parallax)
- **FAQSection** -- subtle fade-in parallax

### 4. CTABanner background parallax
The CTA banner already has a background image. Apply `useTransform` to shift the background image Y position at 50% scroll speed relative to the section -- the classic parallax background effect.

### 5. Hero section enhancements
- Left content block: slight upward parallax offset
- Stats row: separate parallax layer moving slightly slower
- Glow orb: moves at a different rate for depth

## Technical Approach

**ParallaxSection component:**
```tsx
// Props: yOffset (px range), opacity range, scale range
// Uses useScroll({ target: ref, offset }) + useTransform
// Wraps children in motion.div with computed style
```

**Performance considerations:**
- All transforms use GPU-accelerated CSS (`transform`, `opacity`)
- `will-change: transform` on parallax elements
- Respect `prefers-reduced-motion` -- disable parallax for accessibility
- Use `viewport: { once: false }` so effects work on scroll both directions

## Files to Create/Modify
- **Create**: `src/components/landing/ParallaxSection.tsx` -- reusable parallax wrapper
- **Modify**: `src/pages/LandingPage.tsx` -- wrap sections with parallax
- **Modify**: `src/components/landing/HeroSection.tsx` -- add content parallax layers
- **Modify**: `src/components/landing/CTABanner.tsx` -- background image parallax
- **Modify**: `src/index.css` -- add `prefers-reduced-motion` rule for parallax

