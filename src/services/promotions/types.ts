export type PromotionType = 'percentage' | 'flat_discount' | 'bogo' | 'free_delivery' | 'combo';
export type PromotionStatus = 'draft' | 'pending_approval' | 'active' | 'rejected' | 'paused' | 'expired';
export type PromotionOrigin = 'restaurant' | 'superadmin' | 'sponsored';

export interface EnterprisePromotion {
  id: string;
  restaurant_id: string;
  
  // Basic Info
  title: string;
  description: string | null;
  image_url: string | null;
  banner_url: string | null;
  
  // Metadata
  promo_code: string | null;
  origin: PromotionOrigin;
  status: PromotionStatus;
  priority: number;
  
  // Rules & Valuation
  type: PromotionType;
  discount_value: number;
  max_discount: number | null;
  min_order_value: number;
  
  // Targeting
  target_menu_item_ids: string[] | null;
  target_category_ids: string[] | null;
  new_users_only: boolean;
  valid_days: number[] | null;
  valid_hours_start: string | null;
  valid_hours_end: string | null;
  
  // Timeline
  start_date: string;
  end_date: string;
  
  // Analytics tracking
  usage_count: number;
  max_usage: number | null;
  max_usage_per_user: number;
  
  // Workflow
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category_id?: string;
}

export interface DiscountResult {
  promotionId: string;
  title: string;
  discountAmount: number;
  type: PromotionType;
  appliedToItemIds?: string[];
}

export interface CartPricingResult {
  subtotal: number;
  totalDiscount: number;
  tax: number;
  deliveryFee: number;
  finalTotal: number;
  appliedDiscounts: DiscountResult[];
}
