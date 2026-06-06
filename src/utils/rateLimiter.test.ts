import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit, getRemainingCooldown, resetRateLimit, RATE_LIMITS } from "./rateLimiter";

describe("rateLimiter utility", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("allows a single request for WAITER_CALL within limit", () => {
    const action = "waiter_call_table_1";
    const allowed = checkRateLimit(
      action,
      RATE_LIMITS.WAITER_CALL.maxAttempts,
      RATE_LIMITS.WAITER_CALL.windowMs
    );
    expect(allowed).toBe(true);
  });

  it("blocks subsequent requests that exceed maxAttempts within windowMs", () => {
    const action = "order_submit_table_1";
    // First attempt is allowed
    expect(checkRateLimit(action, 1, 5000)).toBe(true);
    // Second attempt is blocked
    expect(checkRateLimit(action, 1, 5000)).toBe(false);
  });

  it("allows requests after the window expires", () => {
    const action = "payment_attempt_1";
    const windowMs = 50; // short window for testing
    expect(checkRateLimit(action, 1, windowMs)).toBe(true);
    expect(checkRateLimit(action, 1, windowMs)).toBe(false);

    // Wait for window to expire
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(checkRateLimit(action, 1, windowMs)).toBe(true);
        resolve();
      }, 60);
    });
  });

  it("returns correct remaining cooldown time in seconds", () => {
    const action = "feedback_submit";
    expect(checkRateLimit(action, 1, 10000)).toBe(true);
    expect(checkRateLimit(action, 1, 10000)).toBe(false);

    const cooldown = getRemainingCooldown(action);
    expect(cooldown).toBeGreaterThan(0);
    expect(cooldown).toBeLessThanOrEqual(10);
  });

  it("resets rate limit properly when resetRateLimit is called", () => {
    const action = "qr_scan_table_2";
    expect(checkRateLimit(action, 1, 10000)).toBe(true);
    expect(checkRateLimit(action, 1, 10000)).toBe(false);

    resetRateLimit(action);

    expect(checkRateLimit(action, 1, 10000)).toBe(true);
  });
});
