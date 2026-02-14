

# Upgrade Landing Page with Real Menu Data and Full Responsiveness

## Overview

Update the landing page to use real menu items from `mockData.ts` instead of hardcoded demo data, enhance the phone mockup in the ProductDemo section to reflect the actual customer UI, and fix responsiveness across all landing page sections and key app screens.

---

## 1. ProductDemo -- Use Real Menu Data

**File**: `src/components/landing/ProductDemo.tsx`

Currently the phone mockup has 4 hardcoded menu items (Butter Chicken, Paneer Tikka, etc.). This will be replaced with items imported from `src/data/mockData.ts` and rendered with the same card style used in the real customer menu.

Changes:
- Import `menuItems` and `categories` from `@/data/mockData`
- Render the first 4 available items dynamically with their real names, prices, images (thumbnail from Unsplash URLs), and category tags (Veg badge for vegetarian items, "Popular" for selected items)
- Add interactive category pills pulled from real categories data
- Show a mini cart bar at the bottom that updates item count/total from the displayed items
- Match the visual style to the actual `FoodCard` / `MenuItemRow` components (green Veg badge, blue add button, proper typography)

## 2. DashboardCarousel -- Richer Mock Content

**File**: `src/components/landing/DashboardCarousel.tsx`

Update the carousel mock rows to use real order data from `mockData.ts` for the Order Management slide, and real menu item names for the Kitchen Display slide, making the demo feel authentic.

## 3. HeroSection -- Responsive Improvements

**File**: `src/components/landing/HeroSection.tsx`

- Reduce floating element sizes on mobile (hidden on small screens to reduce clutter)
- Adjust heading font sizes: `text-3xl` on mobile instead of `text-4xl`
- Make CTA buttons full-width on mobile (`w-full sm:w-auto`)
- Reduce QR code preview padding on mobile
- Lower the `min-h` to `min-h-[80vh]` on mobile to avoid excessive whitespace

## 4. FeaturesSection -- Responsive Grid

**File**: `src/components/landing/FeaturesSection.tsx`

- Change grid to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (currently jumps from 1 to 2 to 3 correctly, but icon sizes and padding need mobile optimization)
- Reduce section padding on mobile: `py-16 md:py-24`

## 5. PricingSection -- Mobile Card Stack

**File**: `src/components/landing/PricingSection.tsx`

- On mobile, cards stack vertically with the "Popular" card first (reorder with `order-first` on mobile)
- Remove the `scale-105` on the popular card at mobile breakpoint to prevent overflow
- Reduce padding: `py-16 md:py-24`

## 6. TestimonialsSection -- Mobile Scroll Fix

**File**: `src/components/landing/TestimonialsSection.tsx`

- Reduce card width on mobile: `w-[280px] sm:w-[340px]`
- Reduce section padding on mobile

## 7. HowItWorks -- Mobile Timeline Fix

**File**: `src/components/landing/HowItWorks.tsx`

- On mobile, all steps should align left (currently the alternating layout breaks on small screens)
- Remove `flex-row-reverse` on mobile: keep `flex-row` always on mobile, alternate only on `md:`
- Reduce section padding on mobile

## 8. CTABanner -- Responsive Text

**File**: `src/components/landing/CTABanner.tsx`

- Reduce heading to `text-2xl md:text-3xl lg:text-5xl`
- Full-width buttons on mobile
- Reduce section padding on mobile: `py-16 md:py-24`

## 9. Landing Header -- Mobile Menu Polish

**File**: `src/pages/LandingPage.tsx`

- Show brand name on all screen sizes (remove `hidden sm:block` from the logo text)
- Ensure mobile menu has proper spacing and touch targets

## 10. CustomerMenu -- Responsive Grid Fix

**File**: `src/pages/CustomerMenu.tsx`

- Ensure the food card grid uses `grid-cols-2` on mobile and scales up properly
- This is already mostly correct but verify the search bar and category slider don't overflow on small screens

---

## Technical Details

### Files Modified

| File | Change Summary |
|------|---------------|
| `src/components/landing/ProductDemo.tsx` | Import real menu data, render dynamic items with images and badges, interactive category pills |
| `src/components/landing/DashboardCarousel.tsx` | Use real mock order/menu data in carousel slides |
| `src/components/landing/HeroSection.tsx` | Mobile-first responsive sizing for text, buttons, floating elements |
| `src/components/landing/FeaturesSection.tsx` | Mobile padding reduction |
| `src/components/landing/PricingSection.tsx` | Mobile card stacking, remove scale on mobile |
| `src/components/landing/TestimonialsSection.tsx` | Smaller card width on mobile |
| `src/components/landing/HowItWorks.tsx` | Fix mobile timeline alignment |
| `src/components/landing/CTABanner.tsx` | Responsive text and button sizing |
| `src/pages/LandingPage.tsx` | Show brand name on mobile |

### No New Files Created

All changes are modifications to existing components.

### Data Source

Real menu items come from `src/data/mockData.ts` which contains 12 items across 6 categories with Unsplash image URLs, prices, and dietary flags -- all used to populate the landing page demo sections.
