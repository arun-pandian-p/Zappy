import { ReviewAIInsight, ReviewRecovery } from "./types";

/**
 * Intelligent Recovery Engine
 * Automatically triggers workflows (like issuing coupons) to recover unhappy customers.
 */
export async function generateRecoveryPlan(
  insight: ReviewAIInsight,
  rating: number,
  orderValue: number = 0
): Promise<ReviewRecovery | null> {
  
  // Only recover if it's a negative or angry review
  if (!insight.is_complaint || rating >= 4) {
    return null;
  }

  // Define recovery strategy
  let action_type: 'coupon_issued' | 'apology_sent' | 'called_customer' = 'apology_sent';
  let discount_value = 0;
  let manager_notes = "Automated apology sent.";

  if (insight.sentiment === 'angry') {
    action_type = 'called_customer'; // Needs manual intervention
    manager_notes = "URGENT: Customer is angry/requested refund. Manager must call immediately.";
  } else if (insight.complaint_categories.length > 0) {
    // If specific complaints exist (e.g. cold food, slow service), issue a coupon to win them back
    action_type = 'coupon_issued';
    discount_value = rating === 1 ? 25 : rating === 2 ? 15 : 10; // 25% for 1 star, 15% for 2, 10% for 3
    manager_notes = `Automated ${discount_value}% recovery coupon issued for ${insight.complaint_categories.join(', ')}.`;
  }

  // Generate unique code if issuing coupon
  const coupon_code = action_type === 'coupon_issued' 
    ? `SORRY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    : null;

  return {
    id: `rec_${Date.now()}`,
    review_id: insight.review_id,
    restaurant_id: insight.restaurant_id,
    status: action_type === 'called_customer' ? 'pending' : 'action_taken',
    manager_notes,
    action_type,
    coupon_code,
    discount_value,
    created_at: new Date().toISOString(),
    resolved_at: action_type === 'called_customer' ? null : new Date().toISOString(),
  };
}
