

# Advanced Animated Landing Page -- Full Rebuild

## Overview
Complete redesign of the landing page with 12 animated sections, advanced micro-interactions, scroll-driven reveals, and a premium SaaS aesthetic. Built entirely with **Framer Motion** (already installed) and **Tailwind CSS** -- no additional dependencies needed.

## Current State
- 5 sections exist: Hero, Features, Testimonials (broken/empty), Pricing, Footer
- Framer Motion already available
- Testimonials component returns `undefined` (broken)
- No scroll progress, no brand strip, no How-It-Works, no CTA banner, no FAQ

## Architecture -- 12 Sections

```text
+--------------------------------------------------+
|  1. Sticky Navbar (blur on scroll + progress bar) |
+--------------------------------------------------+
|  2. Hero (split layout + floating elements)       |
+--------------------------------------------------+
|  3. Brand Logos Strip (infinite marquee)           |
+--------------------------------------------------+
|  4. Features Grid (3x3 interactive cards)         |
+--------------------------------------------------+
|  5. Product Demo Showcase (device mockup)         |
+--------------------------------------------------+
|  6. How It Works (4-step scroll timeline)         |
+--------------------------------------------------+
|  7. Dashboard Preview Carousel (multi-screen)     |
+--------------------------------------------------+
|  8. Integrations Cloud (floating icons)           |
+--------------------------------------------------+
|  9. Pricing (monthly/yearly toggle + hover scale) |
+--------------------------------------------------+
| 10. Testimonials (auto-scroll cards)              |
+--------------------------------------------------+
| 11. FAQ Accordion                                 |
+--------------------------------------------------+
| 12. CTA Banner + Footer                          |
+--------------------------------------------------+
```

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/LandingPage.tsx` | Modify | Add all 12 sections, scroll progress bar, sticky nav with blur |
| `src/components/landing/HeroSection.tsx` | Modify | Split-screen layout, letter stagger headline, mouse parallax on dashboard mockup, particle-like floating elements |
| `src/components/landing/BrandStrip.tsx` | Create | Infinite marquee logo strip with grayscale-to-color hover |
| `src/components/landing/FeaturesSection.tsx` | Modify | Add hover lift + glow border + icon rotate micro-interactions |
| `src/components/landing/ProductDemo.tsx` | Create | Device mockup frame with embedded demo preview, scroll zoom-in |
| `src/components/landing/HowItWorks.tsx` | Create | 4-step vertical timeline with connector line draw, step pop-in |
| `src/components/landing/DashboardCarousel.tsx` | Create | Horizontal carousel showing Orders/Menu/Analytics/Admin screens |
| `src/components/landing/IntegrationsCloud.tsx` | Create | Floating tech icons with hover magnetic pull + tooltip |
| `src/components/landing/PricingSection.tsx` | Modify | Add monthly/yearly toggle, hover scale highlight, popular tag pulse |
| `src/components/landing/TestimonialsSection.tsx` | Modify | Fix broken component, add auto-scroll cards with avatar ripple |
| `src/components/landing/FAQSection.tsx` | Create | Accordion with smooth height animation, icon rotate |
| `src/components/landing/CTABanner.tsx` | Create | Full-width gradient banner with animated glow border, floating shapes |
| `src/components/landing/Footer.tsx` | Modify | Add icon hover bounce, input focus glow micro-interactions |
| `src/components/landing/ScrollProgress.tsx` | Create | Top scroll progress bar component |
| `src/index.css` | Modify | Add marquee animation, glow keyframes, reduced-motion fallback |

## Section Details

### 1. Navbar Enhancement
- Backdrop blur intensifies on scroll
- Thin scroll progress bar at the very top
- Navigation links get underline-slide animation
- Mobile menu uses AnimatePresence for smooth open/close

### 2. Hero Section (Major Rework)
- Split layout: left = text content, right = dashboard mockup
- Headline with letter-by-letter stagger animation
- Subtext opacity reveal with slight y-offset
- CTA buttons scale-in with bounce easing
- Dashboard mockup floats and tilts subtly on mouse move (parallax)
- Multiple floating gradient orbs with independent animation loops
- Animated gradient background shift
- Scroll indicator at bottom

### 3. Brand Logos Strip (New)
- 8-10 restaurant/tech partner logos (SVG placeholders)
- CSS infinite horizontal marquee (duplicated track)
- Grayscale by default, full color on hover
- Pause marquee on hover
- "Trusted by 500+ restaurants" label

### 4. Features Grid (Enhanced)
- Keep existing 9 features
- Add hover effects: card lifts with shadow, icon rotates, gradient border glow trace
- Staggered viewport entry animation (already exists, enhance timing)
- Mobile: single column with swipe hint

### 5. Product Demo Showcase (New)
- Phone/tablet device frame (CSS mockup)
- Shows a screenshot or embedded preview of the customer menu
- Scroll-triggered zoom-in from small to full size
- Subtle screen glow pulse animation

### 6. How It Works (New)
- 4 steps: Scan QR -> Browse Menu -> Place Order -> Track & Enjoy
- Vertical timeline with animated connector line
- Each step icon pops in as you scroll
- Step cards fade-slide from alternating sides
- Icons use the existing Lucide icon set

### 7. Dashboard Preview Carousel (New)
- Embla carousel (already installed) showing 4 dashboard screens
- Glass reflection effect on cards
- Depth shadow on active slide
- Auto-play with pause on hover
- Dot indicators with active state animation

### 8. Integrations Cloud (New)
- Floating grid/cloud of tech icons (Supabase, React, Tailwind, etc.)
- Subtle orbital floating motion
- Hover: icon scales up with tooltip showing name
- "Built with modern tech" tagline

### 9. Pricing Section (Enhanced)
- Add monthly/yearly toggle with price flip animation
- Popular card gets pulse glow on the badge
- Hover: card scales to 1.05
- Price counter animates on toggle

### 10. Testimonials (Fix + Enhance)
- Fix the broken component (currently returns undefined)
- Auto-scrolling horizontal card strip
- Avatar with ripple on hover
- Star rating with shimmer effect
- Quote icon decorative element
- Pause auto-scroll on hover

### 11. FAQ Section (New)
- 6-8 common questions about QR Dine Pro
- Radix Accordion (already installed)
- Smooth height auto animation
- Chevron icon rotates on expand
- Subtle background change on open item

### 12. CTA Banner (New)
- Full-width gradient banner (primary to accent)
- "Ready to Transform Your Restaurant?" headline
- Two CTA buttons: Get Started + Contact Sales
- Animated glow border using CSS
- Small floating decorative shapes

## Global Animation System

### Scroll Reveal (Reusable)
All sections use `whileInView` with `viewport={{ once: true }}`:
- Fade up for text blocks
- Slide left/right for split layouts
- Zoom in for mockups/images
- Blur reveal for backgrounds

### Micro-interactions
- Buttons: scale on hover (1.05), press effect (0.95)
- Cards: lift + shadow on hover
- Links: underline slide animation
- Icons: rotate/bounce on hover
- Inputs: ring glow on focus

### Reduced Motion
- CSS `@media (prefers-reduced-motion: reduce)` disables all custom animations
- Framer Motion respects `useReducedMotion()` hook

### Performance
- All animations use `transform` and `opacity` (GPU accelerated)
- `viewport={{ once: true }}` prevents re-triggering
- Lazy section rendering for below-fold content
- SVG icons over PNGs throughout

## Implementation Order
1. Create utility components (ScrollProgress)
2. Build new sections bottom-up (FAQ, CTA, IntegrationsCloud, HowItWorks, ProductDemo, BrandStrip, DashboardCarousel)
3. Fix TestimonialsSection
4. Enhance existing sections (Hero, Features, Pricing, Footer)
5. Wire everything in LandingPage.tsx with navbar enhancements
6. Add global CSS animations and reduced-motion fallback

