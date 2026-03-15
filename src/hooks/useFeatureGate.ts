import type { Database } from "@/integrations/supabase/types";

type SubscriptionTier = Database["public"]["Enums"]["subscription_tier"];

export type FeatureKey =
  | "dashboard" | "menu" | "orders" | "kitchen" | "billing" | "qr-manager"
  | "reviews" | "users" | "preview" | "settings"
  | "coupons" | "ads" | "offers" | "exports" | "research"
  | "promotions" | "branding" | "multi-outlet" | "inventory";

/** Human-readable labels for sidebar display */
export const FEATURE_LABELS: Record<FeatureKey, string> = {
  dashboard: "Dashboard",
  menu: "Menu",
  orders: "Orders",
  kitchen: "Kitchen",
  billing: "Billing",
  "qr-manager": "QR Manager",
  reviews: "Reviews",
  users: "Users",
  preview: "Preview Site",
  settings: "Settings",
  coupons: "Coupons",
  ads: "Ads",
  offers: "Offers",
  exports: "Exports",
  research: "Research",
  promotions: "Promotions",
  inventory: "Inventory",
  branding: "Branding",
  "multi-outlet": "Multi-Outlet",
};

export const FEATURE_TIERS: Record<FeatureKey, SubscriptionTier> = {
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
  promotions: "pro",
  inventory: "pro",
  branding: "enterprise",
  "multi-outlet": "enterprise",
};

/** Features that the Super Admin can toggle per restaurant */
export const TOGGLEABLE_FEATURES: FeatureKey[] = [
  "coupons", "promotions", "inventory", "exports",
  "branding", "multi-outlet",
];

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

export type FeatureToggles = Record<string, boolean>;

export type LockReason =
  | { type: "plan"; requiredTier: SubscriptionTier; requiredLabel: string }
  | { type: "ads_toggle" }
  | { type: "disabled_by_admin" }
  | null;

export function useFeatureGate(
  subscriptionTier: SubscriptionTier | null | undefined,
  adsEnabled: boolean | null | undefined,
  featureToggles?: FeatureToggles | null
) {
  const currentTier: SubscriptionTier = subscriptionTier || "free";
  const adsToggle = adsEnabled ?? true;
  const toggles = featureToggles || {};

  const canAccess = (feature: FeatureKey): boolean => {
    const requiredTier = FEATURE_TIERS[feature];
    if (!requiredTier) return true;

    // Check super-admin toggle first
    if (toggles[feature] === false) return false;

    if (TIER_RANK[currentTier] < TIER_RANK[requiredTier]) return false;

    if ((feature === "ads" || feature === "offers" || feature === "promotions") && !adsToggle) return false;

    return true;
  };

  const isLocked = (feature: FeatureKey): LockReason => {
    const requiredTier = FEATURE_TIERS[feature];
    if (!requiredTier) return null;

    // Check super-admin toggle first
    if (toggles[feature] === false) {
      return { type: "disabled_by_admin" };
    }

    if (TIER_RANK[currentTier] < TIER_RANK[requiredTier]) {
      return {
        type: "plan",
        requiredTier,
        requiredLabel: TIER_LABELS[requiredTier],
      };
    }

    if ((feature === "ads" || feature === "offers" || feature === "promotions") && !adsToggle) {
      return { type: "ads_toggle" };
    }

    return null;
  };

  return { canAccess, isLocked, currentTier, TIER_LABELS };
}
