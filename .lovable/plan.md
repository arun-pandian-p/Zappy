

# Animated Hotel Branding + Mascot System

## Overview

Add animated hotel name typography with animal mascot themes to the customer menu header, admin dashboard header, and a QR splash/loading screen. Admins configure animation style and mascot from the Settings panel. All animation config is stored in the existing `restaurants.settings` JSONB column (no migration needed).

## Architecture

### Data Model (no migration)

Store animation config in the existing `restaurants.settings` JSONB field alongside `qr_base_url`:

```text
settings: {
  qr_base_url: "...",
  branding: {
    animation_enabled: true,
    letter_animation: "bounce" | "wave" | "glow" | "slide" | "typing",
    mascot: "lion" | "tiger" | "elephant" | "peacock" | "fish" | "owl" | "panda" | "horse" | "none",
    animation_speed: "slow" | "normal" | "fast",
    glow_color_sync: true
  }
}
```

### Mascot Implementation

Instead of external SVG assets or Lottie files (which would need hosting), mascots are rendered as inline SVG emoji-style illustrations using simple animated SVG paths, or as styled emoji characters with Framer Motion animations. This keeps the bundle small and avoids asset management.

Each mascot has a unique Framer Motion animation pattern:
- Lion: gold glow pulse
- Tiger: horizontal stripe swipe
- Elephant: slow vertical bounce
- Peacock: scale fan-out reveal
- Fish: wave/swim motion
- Owl: blink (opacity flicker)
- Panda: soft bounce
- Horse: speed trail (translateX with blur)

---

## Files to Create

### 1. `src/components/branding/AnimatedHotelName.tsx`
Core reusable component. Renders the hotel name with per-letter Framer Motion animations.

Props:
- `name: string`
- `animation: "bounce" | "wave" | "glow" | "slide" | "typing"`
- `speed: "slow" | "normal" | "fast"`
- `primaryColor?: string`
- `className?: string`

Implementation:
- Splits name into individual `motion.span` elements
- Each animation type applies different Framer Motion variants (e.g., bounce uses `y` keyframes, wave uses sine-wave delays, glow uses `textShadow` animation, slide uses `x` from alternating directions, typing uses sequential opacity)
- Respects `prefers-reduced-motion` media query -- falls back to static text
- Speed maps to transition duration multiplier

### 2. `src/components/branding/MascotIcon.tsx`
Renders the selected mascot as an animated inline element.

Props:
- `mascot: string`
- `size?: number`
- `primaryColor?: string`

Implementation:
- Maps mascot name to an emoji character (e.g., lion="lion-face", tiger="tiger-face", etc.) rendered inside a `motion.div`
- Each mascot has a unique Framer Motion animation loop (bounce, pulse, swim, blink, etc.)
- Sized to match the header context (default 40px)

### 3. `src/components/branding/BrandingAnimationSettings.tsx`
Admin settings card for the branding animation configuration.

UI:
- "Enable Animations" toggle
- "Mascot Theme" dropdown (Lion, Tiger, Elephant, Peacock, Fish, Owl, Panda, Horse, None)
- "Letter Animation" dropdown (Bounce, Wave, Glow Pulse, Slide Reveal, Typing)
- "Animation Speed" dropdown (Slow, Normal, Fast)
- "Sync Glow to Theme Color" toggle
- **Live Preview** section showing the animated hotel name + mascot in real time

### 4. `src/components/branding/QRSplashScreen.tsx`
Shown briefly when customer scans QR and the menu is loading.

UI:
- Centered animated hotel name (large)
- Mascot animation below
- Loading progress bar
- Fades out when menu data is ready

---

## Files to Modify

### 1. `src/components/menu/CustomerTopBar.tsx`
- Import `AnimatedHotelName` and `MascotIcon`
- Replace the static `<h1>{restaurantName}</h1>` with `<AnimatedHotelName>` when animation is enabled
- Add `MascotIcon` next to the logo
- Accept new props: `animationConfig` object (or read from restaurant data)

### 2. `src/components/admin/AdminHeader.tsx`
- Import `AnimatedHotelName` and `MascotIcon`
- Replace static restaurant name with animated version
- Add mascot beside the admin avatar area
- Accept branding config props

### 3. `src/components/admin/SettingsPanel.tsx`
- Import and render `BrandingAnimationSettings` as a new card section
- Read/write branding config from/to the `settings.branding` JSONB path
- Include it in the `handleSave` function alongside existing settings

### 4. `src/pages/CustomerMenu.tsx`
- Import `QRSplashScreen`
- Show splash screen during initial data loading (restaurant + menu fetch)
- Pass animation config to `CustomerTopBar`
- Extract branding settings from restaurant data

### 5. `src/components/menu/OrderStatusPipeline.tsx`
- Add celebration animation when order status changes to "ready" or "served"
- Use mascot + letter bounce on the "Order Placed" success state

---

## Implementation Order

1. Create `AnimatedHotelName.tsx` -- core letter animation component with all 5 presets
2. Create `MascotIcon.tsx` -- emoji-based animated mascot component
3. Create `BrandingAnimationSettings.tsx` -- admin settings card with live preview
4. Add branding settings card to `SettingsPanel.tsx` and wire up save/load
5. Update `CustomerTopBar.tsx` to use animated name + mascot
6. Update `AdminHeader.tsx` to use animated name + mascot
7. Create `QRSplashScreen.tsx` for customer menu loading state
8. Integrate splash screen into `CustomerMenu.tsx`
9. Add celebration animation to `OrderStatusPipeline.tsx`

## Performance and Accessibility

- All animations use Framer Motion (already installed, no new dependencies)
- `prefers-reduced-motion` check disables all animations automatically
- Mascots use emoji characters (no external assets to load)
- Animations are GPU-accelerated (transform/opacity only where possible)
- Splash screen has a max timeout (3 seconds) to prevent infinite loading

