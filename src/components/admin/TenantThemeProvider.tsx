import { useEffect, type ReactNode } from 'react';

/**
 * Converts a hex color to HSL string (without "hsl()" wrapper).
 * Returns format: "H S% L%" for use as CSS custom property value.
 */
function hexToHSL(hex: string): string {
  let r = 0, g = 0, b = 0;
  const h = hex.replace('#', '');
  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16) / 255;
    g = parseInt(h[1] + h[1], 16) / 255;
    b = parseInt(h[2] + h[2], 16) / 255;
  } else if (h.length === 6) {
    r = parseInt(h.substring(0, 2), 16) / 255;
    g = parseInt(h.substring(2, 4), 16) / 255;
    b = parseInt(h.substring(4, 6), 16) / 255;
  } else {
    return '217 91% 60%'; // fallback blue
  }

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hue = 0, sat = 0;
  const lum = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    sat = lum > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: hue = ((b - r) / d + 2) / 6; break;
      case b: hue = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(hue * 360)} ${Math.round(sat * 100)}% ${Math.round(lum * 100)}%`;
}

interface TenantThemeProviderProps {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  children: ReactNode;
}

/**
 * Injects tenant-specific theme colors as CSS custom properties on the root element.
 * This overrides the design system's --primary and --accent tokens,
 * affecting all shadcn/ui components across admin & staff dashboards.
 */
export function TenantThemeProvider({ primaryColor, secondaryColor, children }: TenantThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement;

    if (primaryColor) {
      const hsl = hexToHSL(primaryColor);
      root.style.setProperty('--primary', hsl);
      root.style.setProperty('--sidebar-primary', hsl);
      // Also set ring to match primary
      root.style.setProperty('--ring', hsl);
    }

    if (secondaryColor) {
      const hsl = hexToHSL(secondaryColor);
      root.style.setProperty('--accent', hsl);
      root.style.setProperty('--sidebar-accent', hsl);
    }

    return () => {
      // Clean up on unmount so other pages revert to default theme
      root.style.removeProperty('--primary');
      root.style.removeProperty('--sidebar-primary');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--sidebar-accent');
    };
  }, [primaryColor, secondaryColor]);

  return <>{children}</>;
}
