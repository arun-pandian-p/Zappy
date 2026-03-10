

## Fix Login Page Logo & Layout

### Problem
The logo PNG (`8a88a85f-...png`) has a baked-in white square background that clashes with the dark gradient. Additionally, the spacing between elements is too loose.

### Solution

**File: `src/components/branding/ZappyLogo.tsx`**
- Add `rounded-2xl` class to the logo `<img>` to soften the square edges
- Add `drop-shadow-lg` for depth against the dark background  
- Tighten gap between logo image and text from `gap-3` to `gap-2`

**File: `src/pages/Login.tsx`**
- Left panel: reduce `space-y-5` to `space-y-3` for tighter branding grouping
- Login card: reduce `space-y-7` to `space-y-5` and padding from `p-8 sm:p-10` to `p-7 sm:p-8`
- Sign In button: increase to `h-12`, `text-base`, `font-semibold`, add hover `translate-y` effect
- Reduce form `space-y-4` to `space-y-3.5`

### Visual Result
- Logo blends with rounded corners and shadow on dark background
- Tighter, more professional spacing throughout
- More prominent CTA button with hover lift effect

