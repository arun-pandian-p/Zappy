

## Problem

The ZAPPY hero logo (`src/assets/zappy-hero-logo.png`) still has a visible white/checkered background instead of being truly transparent. This is showing as a white rectangle over the video background in the hero section.

## Solution

Use the AI image generation API (Nano banana pro) to remove the background from the current logo, producing a clean transparent PNG. Then update the asset file.

### Steps

1. **Create a backend function** that takes the current logo image, sends it to the `google/gemini-3-pro-image-preview` model with instructions to remove the background completely, and saves the result.

2. **Alternatively (simpler approach)**: Since the logo has a white background, apply CSS `mix-blend-mode: multiply` on the `<img>` tag in `HeroSection.tsx`. This will make the white background transparent against the dark video background without needing to re-process the image.

   In `HeroSection.tsx`, add to the logo `<img>`:
   ```
   style={{ mixBlendMode: 'multiply' }}
   ```

   This is a one-line CSS fix that makes white pixels transparent when composited against the background.

### File Changes

- **`src/components/landing/HeroSection.tsx`** — Add `mix-blend-mode: multiply` to the hero logo `<img>` element.

