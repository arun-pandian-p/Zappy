import { describe, it, expect } from "vitest";
import { analyzeReviewSentiment } from "./sentimentAnalysisService";

describe("SentimentAnalysisService", () => {
  // ── Positive reviews ────────────────────────────────────────────────────
  describe("Positive reviews", () => {
    it("classifies a 5-star review with positive keywords as positive", async () => {
      const result = await analyzeReviewSentiment(5, "The food was delicious and the staff were friendly!", "rev1", "r1");
      expect(result.sentiment).toBe("positive");
      expect(result.sentiment_score).toBeGreaterThanOrEqual(0.3);
      expect(result.is_complaint).toBe(false);
      expect(result.positive_highlights).toContain("great_food");
      expect(result.positive_highlights).toContain("great_service");
      expect(result.requires_manager_attention).toBe(false);
    });

    it("gives positive sentiment for 4-star with excellent food", async () => {
      const result = await analyzeReviewSentiment(4, "Amazing pizza, fresh and hot!", "rev2", "r1");
      expect(result.sentiment).toBe("positive");
      expect(result.positive_highlights).toContain("great_food");
    });

    it("generates a celebratory reply for positive reviews", async () => {
      const result = await analyzeReviewSentiment(5, "Perfect experience!", "rev3", "r1");
      expect(result.suggested_reply).toContain("5-star");
      expect(result.suggested_reply).toContain("thrilled");
    });
  });

  // ── Neutral reviews ─────────────────────────────────────────────────────
  describe("Neutral reviews", () => {
    it("classifies a 3-star review without keywords as neutral", async () => {
      const result = await analyzeReviewSentiment(3, "It was okay", "rev4", "r1");
      expect(result.sentiment).toBe("neutral");
      expect(result.sentiment_score).toBeGreaterThanOrEqual(-0.3);
      expect(result.sentiment_score).toBeLessThan(0.3);
    });

    it("classifies a 3-star review with no comment as neutral", async () => {
      const result = await analyzeReviewSentiment(3, null, "rev5", "r1");
      expect(result.sentiment).toBe("neutral");
    });
  });

  // ── Negative reviews ────────────────────────────────────────────────────
  describe("Negative reviews", () => {
    it("flags cold food complaint", async () => {
      const result = await analyzeReviewSentiment(2, "The food was cold and tasteless", "rev6", "r1");
      expect(result.sentiment).toBe("negative");
      expect(result.is_complaint).toBe(true);
      expect(result.complaint_categories).toContain("cold_food");
      expect(result.complaint_categories).toContain("poor_food_quality");
      expect(result.requires_manager_attention).toBe(true);
    });

    it("flags slow service complaint", async () => {
      const result = await analyzeReviewSentiment(2, "We waited forever for our order", "rev7", "r1");
      expect(result.is_complaint).toBe(true);
      expect(result.complaint_categories).toContain("slow_service");
    });

    it("flags rude staff complaint", async () => {
      const result = await analyzeReviewSentiment(2, "The waiter was rude and unprofessional", "rev8", "r1");
      expect(result.complaint_categories).toContain("rude_staff");
    });

    it("flags overpriced complaint", async () => {
      const result = await analyzeReviewSentiment(2, "Way too expensive for this quality", "rev9", "r1");
      expect(result.complaint_categories).toContain("overpriced");
    });

    it("flags cleanliness issue", async () => {
      const result = await analyzeReviewSentiment(2, "Found a hair in my food, very dirty place", "rev10", "r1");
      expect(result.complaint_categories).toContain("cleanliness_issue");
    });

    it("generates apology reply for complaints", async () => {
      const result = await analyzeReviewSentiment(2, "The food was cold", "rev11", "r1");
      expect(result.suggested_reply).toContain("apologize");
    });
  });

  // ── Angry / Escalation ──────────────────────────────────────────────────
  describe("Angry review escalation", () => {
    it("escalates refund requests to angry", async () => {
      const result = await analyzeReviewSentiment(1, "Disgusting food, I want a refund now!", "rev12", "r1");
      expect(result.sentiment).toBe("angry");
      expect(result.sentiment_score).toBe(-1.0);
      expect(result.requires_manager_attention).toBe(true);
    });

    it("escalates 1-star with no comment to needing attention", async () => {
      const result = await analyzeReviewSentiment(1, null, "rev13", "r1");
      expect(result.sentiment).toBe("angry");
      expect(result.requires_manager_attention).toBe(true);
    });

    it("escalates legal threat language", async () => {
      const result = await analyzeReviewSentiment(1, "I will sue you for this unacceptable food", "rev14", "r1");
      expect(result.sentiment).toBe("angry");
      expect(result.sentiment_score).toBe(-1.0);
    });
  });

  // ── Fraud detection ─────────────────────────────────────────────────────
  describe("Fraud detection", () => {
    it("flags suspicious no-context 1-star review", async () => {
      const result = await analyzeReviewSentiment(1, null, "rev15", "r1");
      expect(result.fraud_score).toBe(0.4);
    });

    it("flags repetitive spam text", async () => {
      // Create a spammy text: repeat a few words over 500 chars
      const spam = "bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad bad";
      const result = await analyzeReviewSentiment(1, spam, "rev16", "r1");
      expect(result.fraud_score).toBe(0.9);
    });

    it("gives 0 fraud score to genuine detailed positive review", async () => {
      const result = await analyzeReviewSentiment(5, "Amazing food, loved the ambiance, would come again!", "rev17", "r1");
      expect(result.fraud_score).toBe(0);
    });
  });

  // ── Sentiment score clamping ────────────────────────────────────────────
  describe("Sentiment score clamping", () => {
    it("clamps score between -1 and 1", async () => {
      const result = await analyzeReviewSentiment(5, "delicious amazing fresh excellent perfect hot tasty", "rev18", "r1");
      expect(result.sentiment_score).toBeLessThanOrEqual(1);
      expect(result.sentiment_score).toBeGreaterThanOrEqual(-1);
    });
  });

  // ── Metadata ────────────────────────────────────────────────────────────
  describe("Metadata integrity", () => {
    it("returns the correct review_id and restaurant_id", async () => {
      const result = await analyzeReviewSentiment(3, "ok", "myReview123", "myResto456");
      expect(result.review_id).toBe("myReview123");
      expect(result.restaurant_id).toBe("myResto456");
    });

    it("always includes a created_at ISO timestamp", async () => {
      const result = await analyzeReviewSentiment(3, "test", "r1", "rest1");
      expect(result.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
});
