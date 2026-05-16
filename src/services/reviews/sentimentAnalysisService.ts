import { ReviewAIInsight, ReviewSentiment } from "./types";

/**
 * Intelligent Sentiment Analysis Engine
 * In production, this would call a tuned LLM or NLP model.
 * Here we use a robust heuristic + keyword extraction engine for immediate, offline-capable analysis.
 */
export async function analyzeReviewSentiment(
  rating: number,
  comment: string | null,
  reviewId: string,
  restaurantId: string
): Promise<ReviewAIInsight> {
  const text = (comment || "").toLowerCase();
  
  let sentimentScore = (rating - 3) / 2; // -1 to 1 based on rating
  let sentiment: ReviewSentiment = 'neutral';
  let is_complaint = false;
  let requires_manager_attention = false;
  let fraud_score = 0.0;
  
  const complaint_categories: string[] = [];
  const positive_highlights: string[] = [];
  
  // Keyword mapping for deep insights
  const keywords = {
    food_cold: ['cold', 'freezing', 'not hot', 'lukewarm'],
    food_quality: ['stale', 'bad', 'undercooked', 'raw', 'salty', 'bland', 'tasteless', 'burnt'],
    food_good: ['delicious', 'tasty', 'amazing', 'perfect', 'yummy', 'fresh', 'hot', 'excellent'],
    service_slow: ['slow', 'late', 'delayed', 'waited', 'waiting', 'forever'],
    service_rude: ['rude', 'impolite', 'unprofessional', 'attitude', 'ignored'],
    service_good: ['friendly', 'fast', 'quick', 'polite', 'helpful', 'attentive'],
    price_high: ['expensive', 'overpriced', 'costly'],
    cleanliness: ['dirty', 'unclean', 'messy', 'hair', 'bug', 'hygiene'],
    refund_intent: ['refund', 'money back', 'chargeback', 'unacceptable', 'disgusting', 'lawyer', 'sue']
  };

  // Analyze text
  if (text) {
    if (keywords.food_cold.some(k => text.includes(k))) complaint_categories.push('cold_food');
    if (keywords.food_quality.some(k => text.includes(k))) complaint_categories.push('poor_food_quality');
    if (keywords.service_slow.some(k => text.includes(k))) complaint_categories.push('slow_service');
    if (keywords.service_rude.some(k => text.includes(k))) complaint_categories.push('rude_staff');
    if (keywords.price_high.some(k => text.includes(k))) complaint_categories.push('overpriced');
    if (keywords.cleanliness.some(k => text.includes(k))) complaint_categories.push('cleanliness_issue');
    
    if (keywords.food_good.some(k => text.includes(k))) positive_highlights.push('great_food');
    if (keywords.service_good.some(k => text.includes(k))) positive_highlights.push('great_service');

    // Sentiment adjustments based on text intensity
    if (complaint_categories.length > 0) sentimentScore -= 0.3;
    if (positive_highlights.length > 0) sentimentScore += 0.3;
    
    // Critical escalation
    if (keywords.refund_intent.some(k => text.includes(k)) || rating === 1) {
      sentiment = 'angry';
      requires_manager_attention = true;
      sentimentScore = -1.0;
    }
  }

  // Finalize Sentiment
  sentimentScore = Math.max(-1, Math.min(1, sentimentScore)); // Clamp between -1 and 1

  if (sentiment !== 'angry') {
    if (sentimentScore <= -0.3) sentiment = 'negative';
    else if (sentimentScore >= 0.3) sentiment = 'positive';
    else sentiment = 'neutral';
  }

  is_complaint = complaint_categories.length > 0 || sentiment === 'negative' || sentiment === 'angry';
  if (is_complaint && rating <= 2) requires_manager_attention = true;

  // Fraud detection (very basic heuristic: generic short negative text with 1 star, or spam repetitions)
  if (text.length > 500 && new Set(text.split(' ')).size < text.split(' ').length * 0.3) {
    fraud_score = 0.9; // Highly repetitive spam
  } else if (!text && rating === 1) {
    fraud_score = 0.4; // Suspicious no-context 1-star
  }

  // Auto-generate suggested reply
  let suggested_reply = "Thank you for your feedback.";
  if (sentiment === 'positive') {
    suggested_reply = `Thank you for the amazing ${rating}-star review! We're thrilled you had a great experience and hope to serve you again soon. ❤️`;
  } else if (sentiment === 'neutral') {
    suggested_reply = "Thank you for your feedback! We are always looking for ways to improve and hope your next visit is even better.";
  } else if (is_complaint) {
    const mainIssue = complaint_categories[0] ? complaint_categories[0].replace('_', ' ') : 'your experience';
    suggested_reply = `We sincerely apologize for the issues with ${mainIssue}. This is not our standard. Our manager has been notified and we would love to make this right.`;
  }

  return {
    review_id: reviewId,
    restaurant_id: restaurantId,
    sentiment,
    sentiment_score: Number(sentimentScore.toFixed(2)),
    is_complaint,
    complaint_categories,
    positive_highlights,
    suggested_reply,
    requires_manager_attention,
    fraud_score,
    created_at: new Date().toISOString()
  };
}
