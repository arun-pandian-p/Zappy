

# Update Landing Page to Match Reference Design

## Overview

Redesign the landing page sections to match the uploaded reference image, featuring a warm gradient aesthetic, glassmorphism cards, and restructured content sections.

---

## 1. Hero Section Redesign

**File**: `src/components/landing/HeroSection.tsx`

- Keep the "Scan. Order. Enjoy." heading with bold styling
- Add subtitle: "Digitize Dining in Seconds."
- Keep existing description text and CTA buttons (Get Started Free + Try Demo)
- Replace the animated QR code block with a warm gradient background (orange/amber tones blending into a soft glow)
- Add floating decorative orbs with warm amber/orange gradients instead of the current cold-tone ones
- Remove the scroll indicator at the bottom

## 2. Features Section -- "Streamline Your Restaurant"

**File**: `src/components/landing/FeaturesSection.tsx`

- Change heading to: "Streamline Your Restaurant"
- Change subtitle to: "Powerful features to improve your service & sales."
- Reduce the 9-card grid down to **4 key feature cards** in a single row:
  1. **Kitchen Display** -- Monitor icon (blue/teal), "Real-time order management with KDS."
  2. **Easy Billing** -- CreditCard icon (orange/red), "Fast checkout and receipt printing."
  3. **Waiter Calls** -- Bell icon (green), "Instant table-side assistance with orders."
  4. **Analytics** -- BarChart icon (blue/indigo), "Track sales, reviews, & revenue in orders."
- Cards use glassmorphism style: `bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl shadow-lg`
- Each card has a colored circular icon container matching the reference

## 3. How It Works Section Redesign

**File**: `src/components/landing/HowItWorks.tsx`

- Keep heading: "How It **Works**"
- Change subtitle to: "Powerful features to improve your service & sales."
- Replace the vertical timeline with a **two-column layout**:
  - Left column: a card showing "Scan QR Code" header with a mini order status pipeline:
    - T11 - Pending (yellow dot, "Sub" badge)
    - TT3 - Preparing (blue dot, "Eat" badge)
    - TT5 - Ready (green dot, "Eat" badge)
  - Right column: placeholder illustration area (styled card with gradient background)
- Use glassmorphism card styling consistent with the features section

## 4. New Section -- "Live Dashboard for Smart Management"

**File**: `src/components/landing/FeaturesSection.tsx` (add as a second features block) or create a new component

Create a new component: `src/components/landing/LiveDashboardSection.tsx`

- Heading: "Live Dashboard for Smart **Management**"
- Subtitle: "Get started today and join 1,500+ restaurants supercharging their service."
- 4 feature cards in a row:
  1. **Mobile First** -- Smartphone icon, "Your fast mobile menu with ease and spending."
  2. **Real-time Sync** -- RefreshCw icon, "Fast sync of your orders."
  3. **Thermal Print** -- Printer icon, "Add items to cart, and customize receipts."
  4. **Get Served** -- UtensilsCrossed icon, "Kitchen prepares, serves & manages orders."
- Same glassmorphism card style as the features section
- Warm gradient background section

## 5. Landing Page Assembly

**File**: `src/pages/LandingPage.tsx`

- Insert the new `LiveDashboardSection` component after `DashboardCarousel` and before `IntegrationsCloud`

## 6. Global Style Touches

- Add warm gradient backgrounds (orange/amber glow) to hero and bottom sections
- Use consistent glassmorphism card styling across all new/updated sections
- Ensure all sections have proper Framer Motion scroll-reveal animations

---

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/landing/LiveDashboardSection.tsx` | New "Live Dashboard for Smart Management" section |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/landing/HeroSection.tsx` | Add subtitle, warm gradients, remove scroll indicator |
| `src/components/landing/FeaturesSection.tsx` | Reduce to 4 cards, glassmorphism style, new heading |
| `src/components/landing/HowItWorks.tsx` | Two-column layout with order status pipeline card |
| `src/pages/LandingPage.tsx` | Add LiveDashboardSection to page flow |

