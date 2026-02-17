
# Customer Menu UI Builder + Realtime Sync + Compact Design

This plan addresses the full PDR: fixing the broken admin preview sync, adding an Appearance Studio to the admin panel, applying tenant theme/branding dynamically on the customer menu, and improving the menu's compact layout.

---

## What's Broken Now

1. **Admin preview URL is stale**: `AdminDashboard.tsx` line 464 still points to `/order` instead of `/customer-menu` -- the preview iframe loads nothing.
2. **Realtime sync partially working**: The customer menu already subscribes to `restaurants`, `offers`, and `menu_items` changes via Supabase Realtime, but the query key for menu items uses `menuItems` in the subscription but `menu_items` in the hook -- mismatch needs fixing.
3. **Theme/branding not applied**: The customer menu fetches `primary_color`, `font_family`, `theme_config` from the restaurant record but never applies them as CSS custom properties. Colors and fonts are hardcoded via Tailwind defaults.
4. **No Appearance Studio**: Settings panel has basic restaurant info, tax, printer, reviews -- no dedicated section for colors, fonts, logo management, or menu density controls.

---

## Implementation Phases

### Phase 1: Fix Preview URL + Realtime Query Key

**Files modified:**
- `src/pages/AdminDashboard.tsx` -- Change `customerPreviewUrl` from `/order?r=` to `/customer-menu?r=`
- `src/pages/CustomerMenu.tsx` -- Fix realtime subscription query key from `menuItems` to `menu_items` to match the hook's queryKey

### Phase 2: Dynamic Theme Application on Customer Menu

Apply the tenant's `primary_color`, `secondary_color`, `font_family`, and `theme_config` as inline CSS custom properties on the customer menu root element. This makes all Tailwind theme tokens (`--primary`, `--success`, etc.) respond to admin changes instantly via realtime.

**How it works:**
- When `restaurant` data loads, convert `primary_color` (hex) to HSL and inject as `--primary` CSS variable
- Apply `font_family` to the root container's `fontFamily` style
- The `theme_config.button_style` controls border-radius on Add buttons

**Files modified:**
- `src/pages/CustomerMenu.tsx` -- Add a `useMemo` that converts hex colors to HSL, wrap the root `<div>` with `style={{ }}` containing CSS custom properties and fontFamily
- `src/components/menu/CustomerTopBar.tsx` -- Apply tenant primary color to the logo border and name color

**No database changes needed** -- the `restaurants` table already has `primary_color`, `secondary_color`, `font_family`, and `theme_config` (JSONB) columns.

### Phase 3: Appearance Studio in Admin Panel

A new admin tab called "Appearance" that consolidates all visual customization into one place.

**New file: `src/components/admin/AppearanceStudio.tsx`**

Sections inside the studio:

1. **Logo Manager** -- Upload/replace header logo, favicon, banner, cover image (reuses existing `ImageUpload` component and the existing `menu-images` storage bucket)
2. **Theme Colors** -- Color pickers for primary, secondary, accent colors with live preview swatch
3. **Typography** -- Font family selector (Inter, Playfair Display, Roboto, Poppins, Lato, Montserrat) for headings and body
4. **Menu Layout** -- Grid/List toggle, card density slider (compact/standard/detailed), offers slider toggle, dietary badges toggle
5. **Theme Presets** -- Quick-apply presets (Classic, Dark, Premium, Minimal) same as onboarding
6. **Animation Controls** -- Enable/disable fade-in on items, hover zoom on images (stored in `theme_config`)

All settings save to the existing `restaurants` table columns (`primary_color`, `secondary_color`, `font_family`, `theme_config`, `logo_url`, `favicon_url`, `banner_image_url`, `cover_image_url`, `settings.menu_display`).

**Files modified:**
- `src/pages/AdminDashboard.tsx` -- Add "Appearance" tab to `mainTabs` array, render `AppearanceStudio` component
- `src/components/admin/AdminSidebar.tsx` -- Add "Appearance" nav item with Palette icon

### Phase 4: Compact Menu Card Enhancements

Improve the FoodCard and MenuItemRow components to respect the admin's `card_style` setting:

- **Compact mode**: Smaller image (aspect 2:1), no description, tighter padding, height under 140px
- **Standard mode**: Current layout (unchanged)
- **Detailed mode**: Larger image, full description, prep time, spicy level indicator

**Files modified:**
- `src/components/menu/FoodCard.tsx` -- Accept `cardStyle` prop, adjust aspect ratio and content based on density
- `src/components/menu/MenuItemRow.tsx` -- Accept `cardStyle` prop for compact/detailed variants
- `src/pages/CustomerMenu.tsx` -- Pass `menuDisplaySettings.card_style` to FoodCard and MenuItemRow

### Phase 5: Category Banner Support

Allow category images (already in `categories.image_url` column) to display as banners between menu sections when the customer scrolls.

**Files modified:**
- `src/pages/CustomerMenu.tsx` -- Group filtered items by category, render category header with image if available before each group

---

## Technical Details

### Hex to HSL Conversion (for CSS variables)
```text
function hexToHSL(hex: string): string {
  // Convert hex -> RGB -> HSL
  // Return "H S% L%" format for CSS var injection
}
```

### CSS Variable Injection Pattern
```text
<div style={{
  '--primary': hexToHSL(restaurant.primary_color),
  '--success': hexToHSL(restaurant.secondary_color),
  fontFamily: restaurant.font_family || 'Inter',
}}>
```
This makes all existing Tailwind `text-primary`, `bg-success`, `border-primary` classes automatically adopt tenant colors.

### Realtime Flow
```text
Admin saves color in Appearance Studio
  -> Supabase UPDATE restaurants
  -> Realtime postgres_changes fires
  -> Customer menu invalidates 'restaurant' query
  -> New colors loaded -> CSS vars update
  -> UI re-renders with new theme (<1 sec)
```

### Files Summary

| Action | File |
|---|---|
| Fix | `src/pages/AdminDashboard.tsx` (preview URL) |
| Fix | `src/pages/CustomerMenu.tsx` (query key + theme injection + card style + category banners) |
| Create | `src/components/admin/AppearanceStudio.tsx` |
| Modify | `src/components/admin/AdminSidebar.tsx` (add Appearance nav) |
| Modify | `src/components/menu/FoodCard.tsx` (card density) |
| Modify | `src/components/menu/MenuItemRow.tsx` (card density) |
| Modify | `src/components/menu/CustomerTopBar.tsx` (tenant color) |

### No New Database Tables or Migrations
All data is stored in existing `restaurants` columns. No schema changes needed.

### No New Dependencies
Pure CSS/Tailwind + existing Framer Motion for animations.
