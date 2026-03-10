

## Fix Login Page Logo Design

### Problem
The logo on the login page left panel appears as a small, square app-icon (100px) without any accompanying brand text or tagline, making it look underwhelming and disconnected.

### Solution
Enhance the left panel branding by:

1. **Increase logo size** from 100px to ~140px for better visual presence
2. **Add "ZAPPY" brand text** below the logo in large, bold white lettering
3. **Add the tagline** "Scan, Order, Eat, Repeat" below the brand name
4. **Update `ZappyLogo` component** to actually use the `showTagline`, `textColor`, and `animated` props that are already accepted but ignored
5. **Add subtle animation** to the logo (scale-in or fade) using Framer Motion, leveraging the `animated` prop

### Files Changed
- **`src/components/branding/ZappyLogo.tsx`** — Render brand text + tagline when `showTagline` is true, apply `textColor`, add Framer Motion animation when `animated` is true
- **`src/pages/Login.tsx`** — Adjust logo `size` prop to 140, keep existing props (`showTagline`, `animated`, `textColor`)

### Visual Result
The left panel will show:
```text
   [Logo Image - larger]
       ZAPPY
  Scan, Order, Eat, Repeat
  ─────────────────────
  One login for every role...
```

