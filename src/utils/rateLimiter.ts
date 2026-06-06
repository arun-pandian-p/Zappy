/**
 * Client-side rate limiter to prevent abuse of public actions.
 * Uses localStorage to persist limits across page refreshes.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // epoch ms
}

const STORAGE_KEY = "zappy_rate_limits";

function getStore(): Record<string, RateLimitEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStore(store: Record<string, RateLimitEntry>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

/**
 * Check if an action is rate-limited.
 * @param action - Unique action identifier (e.g., "waiter_call_<tableId>")
 * @param maxAttempts - Max attempts within the window
 * @param windowMs - Time window in milliseconds
 * @returns `true` if the action is ALLOWED, `false` if rate-limited
 */
export function checkRateLimit(
  action: string,
  maxAttempts: number,
  windowMs: number
): boolean {
  const store = getStore();
  const entry = store[action];
  const now = Date.now();

  // If no entry or window expired, allow and reset
  if (!entry || now >= entry.resetAt) {
    store[action] = { count: 1, resetAt: now + windowMs };
    setStore(store);
    return true;
  }

  // If within window and under limit, allow
  if (entry.count < maxAttempts) {
    entry.count += 1;
    setStore(store);
    return true;
  }

  // Rate limited
  return false;
}

/**
 * Get remaining cooldown time in seconds for a rate-limited action.
 */
export function getRemainingCooldown(action: string): number {
  const store = getStore();
  const entry = store[action];
  if (!entry) return 0;

  const remaining = entry.resetAt - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

/**
 * Reset rate limit for a specific action.
 */
export function resetRateLimit(action: string): void {
  const store = getStore();
  delete store[action];
  setStore(store);
}

// Predefined rate limit configs for common actions
export const RATE_LIMITS = {
  /** Waiter call: 1 per 30 seconds per table */
  WAITER_CALL: { maxAttempts: 1, windowMs: 30_000 },
  /** Order submission: 1 per 5 seconds */
  ORDER_SUBMIT: { maxAttempts: 1, windowMs: 5_000 },
  /** Feedback submission: 3 per 5 minutes */
  FEEDBACK: { maxAttempts: 3, windowMs: 300_000 },
  /** QR scan logging: 10 per minute */
  QR_SCAN: { maxAttempts: 10, windowMs: 60_000 },
  /** Payment attempt: 3 per 30 seconds */
  PAYMENT: { maxAttempts: 3, windowMs: 30_000 },
} as const;
