

# Cinematic Landing Page Upgrade

## Overview

Transform the landing page into a cinematic SaaS storytelling experience with warm glassmorphism, floating glass UI panels in the hero, a live dashboard teaser with animated metrics, and smooth section transitions -- all using Framer Motion (no GSAP/Three.js needed).

---

## 1. Hero Section -- Cinematic Glass Redesign

**File**: `src/components/landing/HeroSection.tsx` (full rewrite)

### Changes

- **Two-column layout**: Left side has headline + CTAs, right side has floating glass panels
- **Updated headline**: "Scan. Order. Serve. Scale." with subtitle "The Smart Operating System for Restaurants."
- **Updated description**: Mentions kitchen sync, POS integration, automated billing
- **3 CTA buttons**: Get Started Free, View Live Demo, Scan Demo QR
- **Remove scroll indicator** (already removed)
- **Add floating glass UI panels** on the right side:
  - Order card panel (table + items list)
  - Revenue chip (shows a stat like "42,880")
  - QR scan box with glow pulse animation
  - Printer receipt panel with subtle roll animation
- **Glass panel style**: `backdrop-blur-[30px]`, `bg-white/[0.08]`, `border border-white/[0.18]`, warm gradient overlays
- **Cinematic lighting**: Radial light glow behind the floating panels, warm gradient orbs (keep existing but enhance)
- **Floating particles**: Small dot elements that drift slowly for atmospheric depth

### Props

- Keep existing `onGetStarted` and `onScanDemo` props

---

## 2. Live Dashboard Teaser Section (New Component)

**File**: `src/components/landing/LiveDashboardTeaser.tsx` (new)

### Layout

- Section title: "Live Restaurant Insights" with a pulsing "Live" badge
- 4 floating glass metric cards in a responsive grid:

| Card | Value | Visual |
|------|-------|--------|
| Today Revenue | 42,880 (animated count-up) | Mini gradient sparkline chart |
| Orders Today | 128 (animated count-up) | Pulse counter dot |
| Active Tables | 23 | Color-shifting heat indicator |
| Pending Orders | 7 | Alert glow ring animation |

### Card Style

- Glass background: `bg-white/[0.08] dark:bg-white/[0.04]`
- Backdrop blur: `backdrop-blur-[24px]`
- Border: `border border-white/[0.12]`
- Shadow: `shadow-[0_20px_60px_rgba(0,0,0,0.35)]`
- Floating hover lift with `whileHover={{ y: -8 }}`

### Animations

- Revenue chart: SVG path draw animation using Framer Motion `pathLength`
- Orders/Revenue counters: Count-up animation from 0 to target value over 2s using `useMotionValue` + `useTransform`
- Pending orders: Pulse glow ring (`animate-pulse-ring`)
- Active tables: Subtle color shift between warm tones
- "Live data updating" pulse indicator at the bottom
- Restaurant count ticker: "1,500+ restaurants trust us"

---

## 3. Hero Floating Glass Panels Detail

Each panel floats with gentle `y` oscillation and staggered delays:

### Order Card Panel
- Shows "Table 5" header, 2-3 mini item rows (Truffle Fries, Biriyani, etc.)
- Glass style with warm inner glow
- Subtle shadow

### Revenue Chip
- Small pill showing "42,880" with an up-arrow icon
- Green accent glow

### QR Scan Box
- QR code icon centered in a glass square
- Radial orange glow pulse behind it

### Receipt Panel
- Narrow tall card mimicking thermal receipt
- Shows restaurant name, items, total
- Subtle "printing" slide-down animation on scroll into view

---

## 4. Update LiveDashboardSection

**File**: `src/components/landing/LiveDashboardSection.tsx` (modify)

- Add warm atmospheric gradient background with radial light spots
- Add a subtle gradient-wipe transition effect at the top edge using a pseudo-element gradient overlay
- Enhance cards with the deeper glass style (blur-[24px] instead of blur-sm)

---

## 5. Section Transition Atmospheres

**File**: `src/pages/LandingPage.tsx` (modify)

- Insert `LiveDashboardTeaser` between `BrandStrip` and `FeaturesSection`
- Add gradient divider elements between major sections for smooth visual flow
- Reorder: Hero -> BrandStrip -> LiveDashboardTeaser -> Features -> ProductDemo -> HowItWorks -> DashboardCarousel -> LiveDashboardSection -> Integrations -> Pricing -> Testimonials -> FAQ -> CTA

---

## 6. Warm Gradient System Enhancement

**File**: `src/index.css` (minor additions)

- Add a `@keyframes float` for reusable floating animation
- Add `.glass-card` utility class for the deep glassmorphism style
- Add `.glass-card-warm` variant with warm gradient border
- Add `@keyframes count-pulse` for the metric counter flash

---

## Technical Details

### New Files

| File | Purpose |
|------|---------|
| `src/components/landing/LiveDashboardTeaser.tsx` | Animated metric cards with count-up, sparklines, glass styling |

### Modified Files

| File | Changes |
|------|---------|
| `src/components/landing/HeroSection.tsx` | Two-column layout, floating glass panels, updated copy, cinematic lighting |
| `src/components/landing/LiveDashboardSection.tsx` | Enhanced glass depth, atmospheric gradient, radial lights |
| `src/pages/LandingPage.tsx` | Insert LiveDashboardTeaser, add gradient dividers between sections |
| `src/index.css` | Add `.glass-card` utility, `@keyframes float`, `@keyframes count-pulse` |

### Animation Approach

All animations use Framer Motion (already installed):
- `motion.div` with `animate` for continuous floating
- `whileInView` for scroll-triggered reveals
- `useMotionValue` + `useTransform` + `useSpring` for count-up numbers
- SVG `motion.path` with `pathLength` for chart draw effects
- Staggered `transition.delay` for card entrance sequences

### No New Dependencies Required

Everything is achievable with existing `framer-motion`, `lucide-react`, and `recharts` packages.

