import { supabase } from "@/integrations/supabase/client";

interface TokenBudget {
  daily: number;
  monthly: number;
  used: { daily: number; monthly: number };
}

const TENANT_BUDGETS = new Map<string, TokenBudget>();
const circuitBreakers = new Map<string, { failures: number; lastFailure: number; open: boolean }>();
const requestDedup = new Map<string, Promise<any>>();
const EMBEDDING_MEMO = new Map<string, number[]>();

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_RESET_MS = 60_000;
const DEDUP_WINDOW_MS = 5_000;

function tenantKey(restaurantId: string, type: "daily" | "monthly"): string {
  const now = new Date();
  const period = type === "daily"
    ? `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
    : `${now.getFullYear()}-${now.getMonth()}`;
  return `zappy_budget_${restaurantId}_${type}_${period}`;
}

export function getCachedEmbedding(text: string): number[] | undefined {
  const normalized = text.trim().toLowerCase();
  return EMBEDDING_MEMO.get(normalized);
}

export function setCachedEmbedding(text: string, embedding: number[]) {
  const normalized = text.trim().toLowerCase();
  EMBEDDING_MEMO.set(normalized, embedding);
  if (EMBEDDING_MEMO.size > 10_000) {
    const firstKey = EMBEDDING_MEMO.keys().next().value;
    if (firstKey) EMBEDDING_MEMO.delete(firstKey);
  }
}

export async function checkTokenBudget(
  restaurantId: string,
  estimatedTokens: number
): Promise<{ allowed: boolean; reason?: string }> {
  const storageKey = `zappy_token_budget_${restaurantId}`;
  const stored = localStorage.getItem(storageKey);
  let budget: TokenBudget = stored
    ? JSON.parse(stored)
    : { daily: 200_000, monthly: 5_000_000, used: { daily: 0, monthly: 0 } };

  if (!stored) {
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("subscription_tier")
      .eq("id", restaurantId)
      .single();
    const tier = restaurant?.subscription_tier || "free";
    if (tier === "free") { budget.daily = 50_000; budget.monthly = 500_000; }
    else if (tier === "basic") { budget.daily = 100_000; budget.monthly = 1_000_000; }
    else if (tier === "pro") { budget.daily = 500_000; budget.monthly = 5_000_000; }
    else if (tier === "enterprise") { budget.daily = 2_000_000; budget.monthly = 20_000_000; }
  }

  const dayKey = tenantKey(restaurantId, "daily");
  const monthKey = tenantKey(restaurantId, "monthly");
  const storedDaily = localStorage.getItem(dayKey);
  const storedMonthly = localStorage.getItem(monthKey);
  budget.used.daily = storedDaily ? parseInt(storedDaily, 10) : 0;
  budget.used.monthly = storedMonthly ? parseInt(storedMonthly, 10) : 0;

  if (budget.used.daily + estimatedTokens > budget.daily) {
    return { allowed: false, reason: "Daily token budget exceeded" };
  }
  if (budget.used.monthly + estimatedTokens > budget.monthly) {
    return { allowed: false, reason: "Monthly token budget exceeded" };
  }

  budget.used.daily += estimatedTokens;
  budget.used.monthly += estimatedTokens;
  localStorage.setItem(dayKey, String(budget.used.daily));
  localStorage.setItem(monthKey, String(budget.used.monthly));
  localStorage.setItem(storageKey, JSON.stringify(budget));

  return { allowed: true };
}

export function checkCircuitBreaker(featureKey: string): boolean {
  const cb = circuitBreakers.get(featureKey);
  if (!cb) return true;
  if (!cb.open) return true;
  const elapsed = Date.now() - cb.lastFailure;
  if (elapsed > CIRCUIT_BREAKER_RESET_MS) {
    cb.open = false;
    cb.failures = 0;
    return true;
  }
  return false;
}

export function recordSuccess(featureKey: string) {
  circuitBreakers.set(featureKey, { failures: 0, lastFailure: 0, open: false });
}

export function recordFailure(featureKey: string) {
  const cb = circuitBreakers.get(featureKey) || { failures: 0, lastFailure: 0, open: false };
  cb.failures++;
  cb.lastFailure = Date.now();
  if (cb.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    cb.open = true;
    console.warn(`[Circuit Breaker] OPEN for ${featureKey} after ${cb.failures} failures`);
  }
  circuitBreakers.set(featureKey, cb);
}

export async function dedupedRequest<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs: number = DEDUP_WINDOW_MS
): Promise<T> {
  const existing = requestDedup.get(key);
  if (existing) return existing as Promise<T>;
  const promise = fn().finally(() => {
    setTimeout(() => requestDedup.delete(key), ttlMs);
  });
  requestDedup.set(key, promise);
  return promise;
}
