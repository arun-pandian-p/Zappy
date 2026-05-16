export type ReviewSentiment = 'positive' | 'neutral' | 'negative' | 'angry';
export type ReviewStatus = 'published' | 'pending_moderation' | 'resolved' | 'escalated';
export type ReviewSource = 'in_app' | 'qr' | 'sms' | 'whatsapp' | 'email';

export interface EnterpriseReview {
  id: string;
  restaurant_id: string;
  order_id: string | null;
  table_id: string | null;
  customer_id: string | null;
  
  overall_rating: number;
  food_rating: number | null;
  service_rating: number | null;
  ambiance_rating: number | null;
  cleanliness_rating: number | null;
  delivery_rating: number | null;
  
  comment: string | null;
  source: ReviewSource;
  status: ReviewStatus;
  redirected_to_google: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface ReviewAIInsight {
  review_id: string;
  restaurant_id: string;
  
  sentiment: ReviewSentiment;
  sentiment_score: number;
  
  is_complaint: boolean;
  complaint_categories: string[];
  positive_highlights: string[];
  
  suggested_reply: string | null;
  requires_manager_attention: boolean;
  fraud_score: number;
  
  created_at: string;
}

export interface ReviewRecovery {
  id: string;
  review_id: string;
  restaurant_id: string;
  
  status: 'pending' | 'action_taken' | 'resolved' | 'failed';
  manager_notes: string | null;
  
  action_type: 'coupon_issued' | 'apology_sent' | 'refund_initiated' | 'called_customer' | null;
  coupon_code: string | null;
  discount_value: number | null;
  
  created_at: string;
  resolved_at: string | null;
}
