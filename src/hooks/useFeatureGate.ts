import type { Database } from "@/integrations/supabase/types";

type SubscriptionTier = Database["public"]["Enums"]["subscription_tier"];

export type FeatureKey =
  | "dashboard" | "menu" | "orders" | "kitchen" | "billing" | "qr-manager"
  | "reviews" | "users" | "preview" | "settings"
  | "coupons" | "ads" | "offers" | "exports" | "research"
  | "branding" | "multi-outlet";

const FEATURE_TIERS: Record<FeatureKey, SubscriptionTier> = {
  dashboard: "free",
  menu: "free",
  orders: "free",
  kitchen: "free",
  billing: "free",
  "qr-manager": "free",
  reviews: "free",
  users: "free",
  preview: "free",
  settings: "free",
  coupons: "pro",
  ads: "pro",
  offers: "pro",
  exports: "pro",
  research: "pro",
  branding: "enterprise",
  "multi-outlet": "enterprise",
};

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Business",
};

export type LockReason =
  | { type: "plan"; requiredTier: SubscriptionTier; requiredLabel: string }
  | { type: "ads_toggle" }
  | null;

export function useFeatureGate(
  subscriptionTier: SubscriptionTier | null | undefined,
  adsEnabled: boolean | null | undefined
) {
  const currentTier: SubscriptionTier = subscriptionTier || "free";
  const adsToggle = adsEnabled ?? true;

  const canAccess = (feature: FeatureKey): boolean => {
    const requiredTier = FEATURE_TIERS[feature];
    if (!requiredTier) return true;

    if (TIER_RANK[currentTier] < TIER_RANK[requiredTier]) return false;

    if ((feature === "ads" || feature === "offers") && !adsToggle) return false;

    return true;
  };

  const isLocked = (feature: FeatureKey): LockReason => {
    const requiredTier = FEATURE_TIERS[feature];
    if (!requiredTier) return null;

    if (TIER_RANK[currentTier] < TIER_RANK[requiredTier]) {
      return {
        type: "plan",
        requiredTier,
        requiredLabel: TIER_LABELS[requiredTier],
      };
    }

    if ((feature === "ads" || feature === "offers") && !adsToggle) {
      return { type: "ads_toggle" };
    }

    return null;
  };

  return { canAccess, isLocked, currentTier, TIER_LABELS };
}
