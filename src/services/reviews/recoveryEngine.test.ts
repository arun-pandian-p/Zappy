import { describe, it, expect } from "vitest";
import { generateRecoveryPlan } from "./recoveryEngine";
import { ReviewAIInsight } from "./types";

function makeInsight(overrides: Partial<ReviewAIInsight>): ReviewAIInsight {
  return {
    review_id: "rev1",
    restaurant_id: "r1",
    sentiment: "negative",
    sentiment_score: -0.5,
    is_complaint: true,
    complaint_categories: ["cold_food"],
    positive_highlights: [],
    suggested_reply: null,
    requires_manager_attention: false,
    fraud_score: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("RecoveryEngine", () => {
  it("returns null for positive review (rating >= 4)", async () => {
    const insight = makeInsight({ is_complaint: false, sentiment: "positive" });
    expect(await generateRecoveryPlan(insight, 5)).toBeNull();
  });

  it("issues 25% coupon for 1-star with complaints", async () => {
    const result = await generateRecoveryPlan(makeInsight({}), 1);
    expect(result!.action_type).toBe("coupon_issued");
    expect(result!.discount_value).toBe(25);
    expect(result!.coupon_code).toMatch(/^SORRY-/);
  });

  it("issues 15% coupon for 2-star", async () => {
    const result = await generateRecoveryPlan(makeInsight({}), 2);
    expect(result!.discount_value).toBe(15);
  });

  it("issues 10% coupon for 3-star with complaints", async () => {
    const result = await generateRecoveryPlan(makeInsight({}), 3);
    expect(result!.discount_value).toBe(10);
  });

  it("triggers called_customer for angry sentiment", async () => {
    const insight = makeInsight({ sentiment: "angry", complaint_categories: [] });
    const result = await generateRecoveryPlan(insight, 1);
    expect(result!.action_type).toBe("called_customer");
    expect(result!.status).toBe("pending");
    expect(result!.resolved_at).toBeNull();
    expect(result!.manager_notes).toContain("URGENT");
    expect(result!.coupon_code).toBeNull();
  });

  it("sends apology when no specific complaint categories", async () => {
    const insight = makeInsight({ sentiment: "negative", complaint_categories: [] });
    const result = await generateRecoveryPlan(insight, 2);
    expect(result!.action_type).toBe("apology_sent");
    expect(result!.discount_value).toBe(0);
  });

  it("generates unique coupon codes", async () => {
    const r1 = await generateRecoveryPlan(makeInsight({}), 2);
    const r2 = await generateRecoveryPlan(makeInsight({}), 2);
    expect(r1!.coupon_code).not.toBe(r2!.coupon_code);
  });

  it("includes correct review_id and restaurant_id", async () => {
    const insight = makeInsight({ review_id: "r42", restaurant_id: "rest99" });
    const result = await generateRecoveryPlan(insight, 2);
    expect(result!.review_id).toBe("r42");
    expect(result!.restaurant_id).toBe("rest99");
  });
});
