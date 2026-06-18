import { supabase } from "@/integrations/supabase/client";

type CacheTTL = "short" | "medium" | "long";

const TTL_MAP: Record<CacheTTL, number> = {
  short: 3_600_000,
  medium: 86_400_000,
  long: 604_800_000,
};

export class AICacheService {
  static async computeHash(input: string): Promise<string> {
    if (typeof crypto === "undefined" || !crypto.subtle) {
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) - hash) + input.charCodeAt(i);
        hash |= 0;
      }
      return "fast_" + Math.abs(hash).toString(16);
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  static async get<T>(feature: string, input: string): Promise<T | null> {
    const hash = await this.computeHash(input);
    const { data, error } = await supabase
      .from("ai_cache")
      .select("response")
      .eq("hash", hash)
      .eq("feature", feature)
      .maybeSingle();
    if (error || !data?.response) return null;
    return JSON.parse(data.response) as T;
  }

  static async set<T>(
    feature: string,
    input: string,
    response: T,
    ttl: CacheTTL = "medium"
  ): Promise<void> {
    const hash = await this.computeHash(input);
    const expiresAt = new Date(Date.now() + TTL_MAP[ttl]).toISOString();
    await supabase.from("ai_cache").upsert({
      hash,
      feature,
      input,
      response: JSON.stringify(response),
      expires_at: expiresAt,
    }).then(({ error }) => {
      if (error) console.error(`[AICache] Write error for ${feature}:`, error);
    });
  }

  static async getOrSet<T>(
    feature: string,
    input: string,
    fn: () => Promise<T>,
    ttl: CacheTTL = "medium"
  ): Promise<T> {
    const cached = await this.get<T>(feature, input);
    if (cached !== null) {
      console.log(`[AICache] HIT ${feature}`);
      return cached;
    }
    console.log(`[AICache] MISS ${feature} — executing`);
    const result = await fn();
    await this.set(feature, input, result, ttl);
    return result;
  }

  static async invalidate(feature: string, input?: string): Promise<void> {
    if (input) {
      const hash = await this.computeHash(input);
      await supabase.from("ai_cache").delete().eq("hash", hash).eq("feature", feature);
    } else {
      await supabase.from("ai_cache").delete().eq("feature", feature);
    }
  }

  static async evictExpired(): Promise<number> {
    const { data, error } = await supabase
      .from("ai_cache")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .select("count");
    if (error) { console.error("[AICache] Eviction error:", error); return 0; }
    const count = data as unknown as { count: number };
    return count?.count || 0;
  }
}
