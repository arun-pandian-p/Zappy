

# Update FeaturesSection to Match Reference Design

## Changes

### `src/components/landing/FeaturesSection.tsx`

1. **Update default features** to match the reference: QR Ordering, Kitchen Display, Analytics, Smart Billing (with updated icons: QrCode, Monitor, BarChart3, CreditCard)
2. **Update default heading/subheading**: "Everything You Need" / "Powerful features to run your restaurant"
3. **Remove gradient text trick** on "Restaurant" — use plain bold black heading like the reference
4. **Restyle cards**: Taller cards with more padding, larger icon container area (gradient blob background instead of simple circle), softer border styling
5. **Enlarge icon area**: Replace the small 14x14 circle with a larger ~24x20 illustration-style container using gradient backgrounds (blue/purple/indigo tones) with the icon centered and larger (~10x10)
6. **Add subtle decorative dots/sparkles** using CSS pseudo-elements around the section for the soft tech feel shown in the reference

### Styling Details
- Cards: `p-8 pt-10`, rounded-2xl, subtle border, min-height for uniformity
- Icon container: ~96x80px with rounded-2xl, soft gradient bg per card (e.g. `bg-gradient-to-br from-blue-100 to-blue-50`)
- Icons: 40x40px size, blue/indigo colors
- Heading: `text-4xl md:text-5xl font-extrabold text-foreground` (no gradient)

