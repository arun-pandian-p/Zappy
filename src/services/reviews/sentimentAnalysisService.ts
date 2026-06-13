import { ReviewAIInsight, ReviewSentiment } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { executeOpenAIChatCall } from "../openaiService";

/**
 * Intelligent Sentiment Analysis Engine
 * Uses a robust local heuristic + keyword extraction engine for immediate, offline-capable analysis,
 * with tier-gated, budget-controlled OpenAI second opinion for ambiguous reviews, and personalized replies.
 */
export async function analyzeReviewSentiment(
  rating: number,
  comment: string | null,
  reviewId: string,
  restaurantId: string
): Promise<ReviewAIInsight> {
  const text = (comment || "").trim().toLowerCase();
  
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

  // Analyze text via local heuristics
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
    if (keywords.refund_intent.some(k => text.includes(k))) {
      sentiment = 'angry';
      requires_manager_attention = true;
      sentimentScore = -1.0;
    }
  }

  // Critical escalation check (even if no comment text)
  if (rating === 1) {
    sentiment = 'angry';
    requires_manager_attention = true;
    sentimentScore = -1.0;
  }

  // Finalize Heuristic Sentiment
  sentimentScore = Math.max(-1, Math.min(1, sentimentScore)); // Clamp between -1 and 1

  if (sentiment !== 'angry') {
    if (sentimentScore <= -0.3) sentiment = 'negative';
    else if (sentimentScore >= 0.3) sentiment = 'positive';
    else sentiment = 'neutral';
  }

  is_complaint = complaint_categories.length > 0 || sentiment === 'negative' || sentiment === 'angry';
  if (is_complaint && rating <= 2) requires_manager_attention = true;

  // Fraud detection (very basic heuristic)
  if (text.length > 500 && new Set(text.split(' ')).size < text.split(' ').length * 0.3) {
    fraud_score = 0.9;
  } else if (!text && rating === 1) {
    fraud_score = 0.4;
  }

  // Default heuristic reply
  let suggested_reply = "Thank you for your feedback.";
  if (sentiment === 'positive') {
    suggested_reply = `Thank you for the amazing ${rating}-star review! We're thrilled you had a great experience and hope to serve you again soon. ❤️`;
  } else if (sentiment === 'neutral') {
    suggested_reply = "Thank you for your feedback! We are always looking for ways to improve and hope your next visit is even better.";
  } else if (is_complaint) {
    const mainIssue = complaint_categories[0] ? complaint_categories[0].replace('_', ' ') : 'your experience';
    suggested_reply = `We sincerely apologize for the issues with ${mainIssue}. This is not our standard. Our manager has been notified and we would love to make this right.`;
  }

  // ============================================================
  // OPENAI ENRICHMENT (Tier-gated & budget-controlled)
  // ============================================================
  let restaurantName = "Zappy Restaurant";
  let subscriptionTier = "free";

  try {
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("name, subscription_tier")
      .eq("id", restaurantId)
      .single();
    if (restaurant) {
      restaurantName = restaurant.name || restaurantName;
      subscriptionTier = restaurant.subscription_tier || "free";
    }
  } catch (err) {
    console.warn("[Sentiment Analysis] Error fetching restaurant info:", err);
  }

  // Calculate heuristic confidence
  let heuristicConfidence = 1.0;
  if (comment && comment.trim().length > 0) {
    const hasComplaints = complaint_categories.length > 0;
    const hasPositives = positive_highlights.length > 0;
    if (!hasComplaints && !hasPositives) {
      heuristicConfidence = 0.5; // Ambiguous: text exists but no keywords matched
    } else if (hasComplaints && hasPositives) {
      heuristicConfidence = 0.4; // Ambiguous: mixed sentiments
    } else {
      heuristicConfidence = 0.8; // Clear sentiment keyword match
    }
  }

  const isProOrEnterprise = subscriptionTier === "pro" || subscriptionTier === "enterprise";

  // 1. OpenAI Second Opinion Sentiment Analysis (if confidence < 0.6 and tier is pro/enterprise)
  if (isProOrEnterprise && heuristicConfidence < 0.6 && comment && comment.trim().length > 0) {
    try {
      console.log(`[Sentiment Analysis] Running OpenAI Second Opinion Sentiment on review (confidence: ${heuristicConfidence})`);
      const systemPrompt = `You are an expert review sentiment classifier for restaurant feedback. Analyze the text and return a JSON object conforming strictly to this format:
{
  "sentiment": "positive" | "neutral" | "negative" | "angry",
  "sentiment_score": number, // between -1.0 and 1.0
  "is_complaint": boolean,
  "complaint_categories": string[], // Choose from: ['cold_food', 'poor_food_quality', 'slow_service', 'rude_staff', 'overpriced', 'cleanliness_issue']
  "positive_highlights": string[] // Choose from: ['great_food', 'great_service', 'nice_ambiance', 'friendly_staff']
}`;

      const userPrompt = `Review text: "${comment}"
Rating given: ${rating} stars`;

      const aiResponse = await executeOpenAIChatCall(
        restaurantId,
        "review_sentiment_analysis",
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        { type: "json_object" }
      );

      const parsedAI = JSON.parse(aiResponse);
      if (parsedAI) {
        sentiment = parsedAI.sentiment || sentiment;
        sentimentScore = typeof parsedAI.sentiment_score === 'number' ? parsedAI.sentiment_score : sentimentScore;
        is_complaint = parsedAI.is_complaint ?? is_complaint;
        if (parsedAI.complaint_categories) {
          complaint_categories.length = 0;
          complaint_categories.push(...parsedAI.complaint_categories);
        }
        if (parsedAI.positive_highlights) {
          positive_highlights.length = 0;
          positive_highlights.push(...parsedAI.positive_highlights);
        }
        if (is_complaint && rating <= 2) {
          requires_manager_attention = true;
        }
        console.log("[Sentiment Analysis] OpenAI Second Opinion results applied:", parsedAI);
      }
    } catch (aiErr) {
      console.warn("[Sentiment Analysis] OpenAI Second Opinion call failed. Defaulting to heuristics.", aiErr);
    }
  }

  // 2. OpenAI Personalized Reply Generation
  if (isProOrEnterprise && comment && comment.trim().length > 0) {
    try {
      console.log("[Sentiment Analysis] Generating personalized reply via OpenAI...");
      const systemPrompt = `You are a warm, polite restaurant manager. Write a concise, personalized response (1-3 sentences max) to a customer review.
Be professional and address the specific feedback mentioned. If there is a complaint, apologize sincerely and say we want to make it right.
Keep it strictly under 60 words. Do not wrap in quotes or add extra headers.`;

      const userPrompt = `Restaurant Name: ${restaurantName}
Review Rating: ${rating}/5 Stars
Customer Comment: "${comment}"
Analyzed Sentiment: ${sentiment}
Identified Issues: ${complaint_categories.join(", ") || "none"}`;

      const personalizedReply = await executeOpenAIChatCall(
        restaurantId,
        "review_recovery_message",
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      );
      if (personalizedReply) {
        suggested_reply = personalizedReply.trim();
        console.log("[Sentiment Analysis] OpenAI Suggested Reply generated:", suggested_reply);
      }
    } catch (aiErr) {
      console.warn("[Sentiment Analysis] OpenAI personalized reply call failed. Defaulting to heuristics.", aiErr);
    }
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

