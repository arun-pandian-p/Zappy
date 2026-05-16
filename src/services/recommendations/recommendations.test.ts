import { describe, it, expect } from "vitest";
import { scoreRecommendations } from "./scoringEngine";
import { getRecommendations, getCartRecommendations } from "./index";
import { analyzeCart } from "./cartIntelligence";
import { detectCuisine } from "./cuisineDetector";
import { generateEmbedding, cosineSimilarity } from "./embeddingService";

describe("RecommendationEngine", () => {
  // ── Food Graph Recommendations ──────────────────────────────────────────
  describe("scoreRecommendations", () => {
    it("recommends raita for biryani (explicit edge)", () => {
      const results = scoreRecommendations(
        ["Biryani"],
        { items: [{ name: "Biryani", price: 250 }], timeOfDay: "evening", weather: "normal" },
        []
      );
      const names = results.map(r => r.name);
      expect(names).toContain("Raita");
    });

    it("recommends sambar for idli (explicit edge)", () => {
      const results = scoreRecommendations(
        ["Idli"],
        { items: [{ name: "Idli", price: 50 }], timeOfDay: "morning", weather: "normal" },
        []
      );
      const names = results.map(r => r.name);
      expect(names).toContain("Sambar");
    });

    it("recommends butter naan for paneer butter masala", () => {
      const results = scoreRecommendations(
        ["Paneer Butter Masala"],
        { items: [{ name: "Paneer Butter Masala", price: 220 }], timeOfDay: "evening", weather: "normal" },
        []
      );
      const names = results.map(r => r.name);
      expect(names).toContain("Butter Naan");
    });

    it("recommends french fries for burger", () => {
      const results = scoreRecommendations(
        ["Burger"],
        { items: [{ name: "Burger", price: 150 }], timeOfDay: "afternoon", weather: "normal" },
        []
      );
      const names = results.map(r => r.name);
      expect(names).toContain("French Fries");
    });

    it("does not recommend items already in cart", () => {
      const results = scoreRecommendations(
        ["Biryani"],
        { items: [{ name: "Biryani", price: 250 }], timeOfDay: "evening", weather: "normal" },
        []
      );
      const names = results.map(r => r.name.toLowerCase());
      expect(names).not.toContain("biryani");
    });

    it("returns at most 4 recommendations", () => {
      const results = scoreRecommendations(
        ["Biryani"],
        { items: [{ name: "Biryani", price: 250 }], timeOfDay: "evening", weather: "normal" },
        []
      );
      expect(results.length).toBeLessThanOrEqual(4);
    });

    it("results are sorted by score descending", () => {
      const results = scoreRecommendations(
        ["Biryani"],
        { items: [{ name: "Biryani", price: 250 }], timeOfDay: "evening", weather: "normal" },
        []
      );
      for (let i = 1; i < results.length; i++) {
        expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score);
      }
    });
  });

  // ── Vegetarian filter ───────────────────────────────────────────────────
  describe("Vegetarian filtering", () => {
    it("penalizes non-veg items when cart is all-veg", () => {
      const results = scoreRecommendations(
        ["Idli", "Dosa"],
        {
          items: [
            { name: "Idli", price: 50, isVegetarian: true },
            { name: "Dosa", price: 80, isVegetarian: true },
          ],
          timeOfDay: "morning",
          weather: "normal",
        },
        []
      );
      const names = results.map(r => r.name);
      // Non-veg items like Chicken Tikka Masala should NOT appear
      expect(names).not.toContain("Chicken Tikka Masala");
    });
  });

  // ── Legacy API wrappers ─────────────────────────────────────────────────
  describe("Legacy API wrappers", () => {
    it("getRecommendations returns results for a dish name", () => {
      const results = getRecommendations("Biryani");
      expect(results.length).toBeGreaterThan(0);
    });

    it("getCartRecommendations returns results for multiple items", () => {
      const results = getCartRecommendations(["Biryani", "Paneer Butter Masala"]);
      expect(results.length).toBeGreaterThan(0);
    });

    it("getCartRecommendations returns empty for empty input", () => {
      expect(getCartRecommendations([])).toEqual([]);
    });
  });

  // ── Cuisine Detector ────────────────────────────────────────────────────
  describe("CuisineDetector", () => {
    it("detects South Indian for dosa", () => {
      expect(detectCuisine("Masala Dosa")).toContain("South Indian");
    });

    it("detects North Indian for paneer", () => {
      expect(detectCuisine("Paneer Tikka")).toContain("North Indian");
    });

    it("detects Fast Food for burger", () => {
      expect(detectCuisine("Chicken Burger")).toContain("Fast Food");
    });

    it("detects Chinese for noodles", () => {
      expect(detectCuisine("Hakka Noodles")).toContain("Chinese");
    });

    it("returns Universal for unknown items", () => {
      expect(detectCuisine("Random Item XYZ")).toContain("Universal");
    });

    it("detects Beverage for drinks", () => {
      expect(detectCuisine("Fresh Orange Juice")).toContain("Beverage");
    });
  });

  // ── Cart Intelligence ───────────────────────────────────────────────────
  describe("CartIntelligence", () => {
    it("detects missing drink", () => {
      const result = analyzeCart({
        items: [{ name: "Biryani", price: 250 }],
        timeOfDay: "evening",
        weather: "normal",
      });
      expect(result.missingTypes).toContain("drink");
    });

    it("detects missing dessert for multi-item meals", () => {
      const result = analyzeCart({
        items: [
          { name: "Biryani", price: 250 },
          { name: "Raita", price: 40 },
        ],
        timeOfDay: "evening",
        weather: "normal",
      });
      expect(result.missingTypes).toContain("dessert");
    });

    it("identifies dominant cuisine", () => {
      const result = analyzeCart({
        items: [
          { name: "Idli", price: 50 },
          { name: "Dosa", price: 80 },
        ],
        timeOfDay: "morning",
        weather: "normal",
      });
      expect(result.dominantCuisine).toBe("South Indian");
    });

    it("identifies all-veg cart", () => {
      const result = analyzeCart({
        items: [
          { name: "Idli", price: 50 },
          { name: "Dosa", price: 80 },
        ],
        timeOfDay: "morning",
        weather: "normal",
      });
      expect(result.isVegetarian).toBe(true);
    });
  });

  // ── Embedding / Similarity ──────────────────────────────────────────────
  describe("EmbeddingService", () => {
    it("generates non-empty embeddings", () => {
      const emb = generateEmbedding("Biryani");
      expect(emb.size).toBeGreaterThan(0);
    });

    it("similar items have higher cosine similarity", () => {
      const e1 = generateEmbedding("Idli");
      const e2 = generateEmbedding("Dosa");
      const e3 = generateEmbedding("Burger");
      const simSouthIndian = cosineSimilarity(e1, e2);
      const simCross = cosineSimilarity(e1, e3);
      expect(simSouthIndian).toBeGreaterThan(simCross);
    });

    it("identical items have similarity = 1.0", () => {
      const e1 = generateEmbedding("Biryani");
      const sim = cosineSimilarity(e1, e1);
      expect(sim).toBeCloseTo(1.0, 1);
    });
  });
});
