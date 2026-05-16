import { CartItem, EnterprisePromotion, CartPricingResult, DiscountResult } from "./types";

/**
 * Enterprise Cart Pricing Engine
 * Evaluates active promotions, resolves conflicts, and applies the best discount logic to the cart.
 */
export function evaluateCartDiscounts(
  cart: CartItem[],
  activePromotions: EnterprisePromotion[],
  taxRate: number = 0.05, // 5% default
  deliveryFee: number = 0 // QR menus usually have 0
): CartPricingResult {
  let subtotal = 0;
  cart.forEach(item => {
    subtotal += item.price * item.quantity;
  });

  const appliedDiscounts: DiscountResult[] = [];
  let totalDiscount = 0;

  // Filter out invalid promotions based on rules
  const validPromotions = activePromotions.filter(promo => {
    // Check minimum order value
    if (subtotal < promo.min_order_value) return false;

    // Check time constraints (simplified)
    const now = new Date();
    const day = now.getDay();
    if (promo.valid_days && promo.valid_days.length > 0 && !promo.valid_days.includes(day)) {
      return false;
    }

    if (promo.valid_hours_start && promo.valid_hours_end) {
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM
      if (currentTime < promo.valid_hours_start || currentTime > promo.valid_hours_end) {
        return false;
      }
    }

    // Check if max usage reached
    if (promo.max_usage && promo.usage_count >= promo.max_usage) {
      return false;
    }

    return true;
  });

  // Sort promotions by priority (lowest number = highest priority)
  validPromotions.sort((a, b) => a.priority - b.priority);

  // Apply promotions
  for (const promo of validPromotions) {
    let discountAmount = 0;
    const appliedToItemIds: string[] = [];

    // Calculate eligible amount
    let eligibleAmount = subtotal;

    // If targeted to specific items
    if (promo.target_menu_item_ids && promo.target_menu_item_ids.length > 0) {
      eligibleAmount = 0;
      cart.forEach(item => {
        if (promo.target_menu_item_ids!.includes(item.id)) {
          eligibleAmount += item.price * item.quantity;
          appliedToItemIds.push(item.id);
        }
      });
      // Skip if cart has none of the targeted items
      if (eligibleAmount === 0) continue;
    }

    // Apply discount logic
    if (promo.type === 'percentage') {
      let rawDiscount = eligibleAmount * (promo.discount_value / 100);
      if (promo.max_discount && rawDiscount > promo.max_discount) {
        rawDiscount = promo.max_discount;
      }
      discountAmount = rawDiscount;
    } 
    else if (promo.type === 'flat_discount') {
      discountAmount = Math.min(eligibleAmount, promo.discount_value);
    }
    else if (promo.type === 'free_delivery') {
      discountAmount = deliveryFee;
      deliveryFee = 0; // Prevent stacking delivery discounts
    }
    else if (promo.type === 'bogo') {
      // Find cheapest eligible item and make it free
      const bogoItems = cart.filter(item => 
        !promo.target_menu_item_ids || promo.target_menu_item_ids.includes(item.id)
      ).sort((a, b) => a.price - b.price);

      if (bogoItems.length > 0) {
        // Simple logic: lowest price item is free
        discountAmount = bogoItems[0].price;
        appliedToItemIds.push(bogoItems[0].id);
      }
    }

    // Safety checks
    if (discountAmount > 0 && totalDiscount + discountAmount <= subtotal) {
      totalDiscount += discountAmount;
      appliedDiscounts.push({
        promotionId: promo.id,
        title: promo.title,
        discountAmount,
        type: promo.type,
        appliedToItemIds: appliedToItemIds.length > 0 ? appliedToItemIds : undefined
      });

      // Stop applying if we reached the subtotal or if business rules prevent stacking
      // We will assume 'flat_discount' and 'percentage' are mutually exclusive for global cart 
      // unless they are item specific. For this engine, we allow stacking up to the subtotal.
    }
  }

  // Calculate final amounts
  const afterDiscount = Math.max(0, subtotal - totalDiscount);
  const tax = afterDiscount * taxRate;
  const finalTotal = afterDiscount + tax + deliveryFee;

  return {
    subtotal,
    totalDiscount,
    tax,
    deliveryFee,
    finalTotal,
    appliedDiscounts
  };
}
