/**
 * Standard utility for resolving URLs across the Zappy platform.
 * Ensures consistent behavior between local development and production.
 */

const FALLBACK_DOMAIN = "https://www.zappy.ind.in";

/**
 * Gets the current origin, with a safe fallback for SSR/Edge environments.
 */
export function getAppOrigin(): string {
  if (typeof window !== "undefined" && window.location) {
    return window.location.origin;
  }
  return import.meta.env.VITE_APP_URL || FALLBACK_DOMAIN;
}

/**
 * Resolves a path (e.g. "/order") to a full absolute URL.
 */
export function resolveAppUrl(path: string): string {
  const origin = getAppOrigin();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${cleanPath}`;
}

/**
 * Normalizes a restaurant URL to ensure it uses the preferred domain.
 */
export function normalizeRestaurantUrl(url: string): string {
  if (!url) return "";
  
  // Replace lovable.app or localhost references if we are in production
  if (typeof window !== "undefined" && !window.location.hostname.includes("localhost")) {
    if (url.includes("lovable.app") || url.includes("localhost")) {
      const path = new URL(url).pathname + new URL(url).search;
      return resolveAppUrl(path);
    }
  }
  
  return url;
}
