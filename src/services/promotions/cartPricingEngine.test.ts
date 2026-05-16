import { describe, it, expect } from "vitest";
import { evaluateCartDiscounts } from "./cartPricingEngine";
import { CartItem, EnterprisePromotion } from "./types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeItem(overrides: Partial<CartItem> & { id: string; price: number; quantity: number }): CartItem {
  return { name: overrides.id, ...overrides };
}

function makePromo(overrides: Partial<EnterprisePromotion> & { id: string }): EnterprisePromotion {
  return {
    restaurant_id: "r1",
    title: overrides.id,
    description: null,
    image_url: null,
    banner_url: null,
    promo_code: null,
    origin: "restaurant",
    status: "active",
    priority: 1,
    type: "percentage",
    discount_value: 10,
    max_discount: null,
    min_order_value: 0,
    target_menu_item_ids: null,
    target_category_ids: null,
    new_users_only: false,
    valid_days: null,
    valid_hours_start: null,
    valid_hours_end: null,
    start_date: "2020-01-01",
    end_date: "2030-12-31",
    usage_count: 0,
    max_usage: null,
    max_usage_per_user: 1,
    rejection_reason: null,
    approved_by: null,
    approved_at: null,
    created_at: "2020-01-01",
    updated_at: "2020-01-01",
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("CartPricingEngine", () => {
  // ── Basic calculation ────────────────────────────────────────────────────
  describe("Basic cart calculation (no promotions)", () => {
    it("computes subtotal, tax, and final total correctly", () => {
      const cart: CartItem[] = [
        makeItem({ id: "a", price: 100, quantity: 2 }),
        makeItem({ id: "b", price: 50, quantity: 1 }),
      ];
      const result = evaluateCartDiscounts(cart, []);
      expect(result.subtotal).toBe(250);
      expect(result.totalDiscount).toBe(0);
      expect(result.tax).toBeCloseTo(12.5); // 5% of 250
      expect(result.finalTotal).toBeCloseTo(262.5);
      expect(result.appliedDiscounts).toHaveLength(0);
    });

    it("handles an empty cart gracefully", () => {
      const result = evaluateCartDiscounts([], []);
      expect(result.subtotal).toBe(0);
      expect(result.finalTotal).toBe(0);
    });

    it("uses a custom tax rate when provided", () => {
      const cart = [makeItem({ id: "a", price: 200, quantity: 1 })];
      const result = evaluateCartDiscounts(cart, [], 0.18);
      expect(result.tax).toBeCloseTo(36);
      expect(result.finalTotal).toBeCloseTo(236);
    });
  });

  // ── Percentage discounts ─────────────────────────────────────────────────
  describe("Percentage discount", () => {
    it("applies a simple percentage discount", () => {
      const cart = [makeItem({ id: "a", price: 200, quantity: 1 })];
      const promo = makePromo({ id: "p1", type: "percentage", discount_value: 10 });
      const result = evaluateCartDiscounts(cart, [promo]);
      expect(result.totalDiscount).toBe(20); // 10% of 200
      expect(result.appliedDiscounts).toHaveLength(1);
      expect(result.appliedDiscounts[0].type).toBe("percentage");
    });

    it("caps at max_discount", () => {
      const cart = [makeItem({ id: "a", price: 1000, quantity: 1 })];
      const promo = makePromo({ id: "p1", type: "percentage", discount_value: 50, max_discount: 100 });
      const result = evaluateCartDiscounts(cart, [promo]);
      expect(result.totalDiscount).toBe(100); // capped
    });
  });

  // ── Flat discounts ───────────────────────────────────────────────────────
  describe("Flat discount", () => {
    it("applies flat discount", () => {
      const cart = [makeItem({ id: "a", price: 300, quantity: 1 })];
      const promo = makePromo({ id: "f1", type: "flat_discount", discount_value: 50 });
      const result = evaluateCartDiscounts(cart, [promo]);
      expect(result.totalDiscount).toBe(50);
    });

    it("flat discount does not exceed eligible amount", () => {
      const cart = [makeItem({ id: "a", price: 30, quantity: 1 })];
      const promo = makePromo({ id: "f2", type: "flat_discount", discount_value: 50 });
      const result = evaluateCartDiscounts(cart, [promo]);
      expect(result.totalDiscount).toBe(30); // capped at subtotal
    });
  });

  // ── BOGO ─────────────────────────────────────────────────────────────────
  describe("BOGO (Buy One Get One)", () => {
    it("makes the cheapest item free", () => {
      const cart = [
        makeItem({ id: "a", price: 150, quantity: 1 }),
        makeItem({ id: "b", price: 80, quantity: 1 }),
      ];
      const promo = makePromo({ id: "bogo1", type: "bogo", discount_value: 0 });
      const result = evaluateCartDiscounts(cart, [promo]);
      expect(result.totalDiscount).toBe(80);
      expect(result.appliedDiscounts[0].appliedToItemIds).toContain("b");
    });
  });

  // ── Free delivery ────────────────────────────────────────────────────────
  describe("Free delivery", () => {
    it("removes delivery fee", () => {
      const cart = [makeItem({ id: "a", price: 200, quantity: 1 })];
      const promo = makePromo({ id: "fd1", type: "free_delivery", discount_value: 0 });
      const result = evaluateCartDiscounts(cart, [promo], 0.05, 40);
      expect(result.totalDiscount).toBe(40);
      expect(result.deliveryFee).toBe(0);
    });
  });

  // ── Min-order guard ──────────────────────────────────────────────────────
  describe("Minimum order value guard", () => {
    it("skips promotion when order is below minimum", () => {
      const cart = [makeItem({ id: "a", price: 50, quantity: 1 })];
      const promo = makePromo({ id: "min1", min_order_value: 100 });
      const result = evaluateCartDiscounts(cart, [promo]);
      expect(result.totalDiscount).toBe(0);
    });

    it("applies promotion when order meets minimum", () => {
      const cart = [makeItem({ id: "a", price: 150, quantity: 1 })];
      const promo = makePromo({ id: "min2", min_order_value: 100 });
      const result = evaluateCartDiscounts(cart, [promo]);
      expect(result.totalDiscount).toBeGreaterThan(0);
    });
  });

  // ── Max usage guard ──────────────────────────────────────────────────────
  describe("Max usage guard", () => {
    it("skips promotion that has exceeded max usage", () => {
      const cart = [makeItem({ id: "a", price: 200, quantity: 1 })];
      const promo = makePromo({ id: "mu", max_usage: 5, usage_count: 5 });
      const result = evaluateCartDiscounts(cart, [promo]);
      expect(result.totalDiscount).toBe(0);
    });

    it("allows promotion under max usage", () => {
      const cart = [makeItem({ id: "a", price: 200, quantity: 1 })];
      const promo = makePromo({ id: "mu2", max_usage: 5, usage_count: 4 });
      const result = evaluateCartDiscounts(cart, [promo]);
      expect(result.totalDiscount).toBeGreaterThan(0);
    });
  });

  // ── Item targeting ───────────────────────────────────────────────────────
  describe("Targeted promotions (specific items)", () => {
    it("applies only to targeted items", () => {
      const cart = [
        makeItem({ id: "x", price: 100, quantity: 1 }),
        makeItem({ id: "y", price: 200, quantity: 1 }),
      ];
      const promo = makePromo({
        id: "target1",
        type: "percentage",
        discount_value: 10,
        target_menu_item_ids: ["x"],
      });
      const result = evaluateCartDiscounts(cart, [promo]);
      expect(result.totalDiscount).toBe(10); // 10% of 100
      expect(result.appliedDiscounts[0].appliedToItemIds).toEqual(["x"]);
    });

    it("skips promo when cart has none of the targeted items", () => {
      const cart = [makeItem({ id: "z", price: 200, quantity: 1 })];
      const promo = makePromo({
        id: "target2",
        type: "percentage",
        discount_value: 10,
        target_menu_item_ids: ["x"],
      });
      const result = evaluateCartDiscounts(cart, [promo]);
      expect(result.totalDiscount).toBe(0);
    });
  });

  // ── Priority ordering ───────────────────────────────────────────────────
  describe("Promotion priority", () => {
    it("applies higher-priority promotions first", () => {
      const cart = [makeItem({ id: "a", price: 500, quantity: 1 })];
      const promoLow = makePromo({ id: "pLow", priority: 10, type: "flat_discount", discount_value: 50 });
      const promoHigh = makePromo({ id: "pHigh", priority: 1, type: "flat_discount", discount_value: 100 });
      const result = evaluateCartDiscounts(cart, [promoLow, promoHigh]);
      // pHigh (priority 1) should be applied first
      expect(result.appliedDiscounts[0].title).toBe("pHigh");
    });
  });

  // ── Stacking ─────────────────────────────────────────────────────────────
  describe("Promotion stacking", () => {
    it("stacks multiple promotions up to subtotal", () => {
      const cart = [makeItem({ id: "a", price: 200, quantity: 1 })];
      const p1 = makePromo({ id: "s1", priority: 1, type: "flat_discount", discount_value: 80 });
      const p2 = makePromo({ id: "s2", priority: 2, type: "flat_discount", discount_value: 80 });
      const result = evaluateCartDiscounts(cart, [p1, p2]);
      expect(result.totalDiscount).toBe(160);
      expect(result.appliedDiscounts).toHaveLength(2);
    });

    it("never discounts more than the subtotal", () => {
      const cart = [makeItem({ id: "a", price: 100, quantity: 1 })];
      const p1 = makePromo({ id: "s1", priority: 1, type: "flat_discount", discount_value: 70 });
      const p2 = makePromo({ id: "s2", priority: 2, type: "flat_discount", discount_value: 70 });
      const result = evaluateCartDiscounts(cart, [p1, p2]);
      // First gives 70, second would give 70 but 70+70=140 > subtotal 100 → second is blocked
      expect(result.totalDiscount).toBe(70);
      expect(result.appliedDiscounts).toHaveLength(1);
    });
  });

  // ── Tax on discounted amount ────────────────────────────────────────────
  describe("Tax calculation after discount", () => {
    it("calculates tax on the post-discount amount", () => {
      const cart = [makeItem({ id: "a", price: 200, quantity: 1 })];
      const promo = makePromo({ id: "t1", type: "flat_discount", discount_value: 50 });
      const result = evaluateCartDiscounts(cart, [promo], 0.1);
      const afterDiscount = 200 - 50; // 150
      expect(result.tax).toBeCloseTo(15); // 10% of 150
      expect(result.finalTotal).toBeCloseTo(165);
    });
  });
});
