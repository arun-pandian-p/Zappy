import { RecommendationResult, CartContext, RecommendationType } from "./types";
import { scoreRecommendations } from "./scoringEngine";
import { detectCuisine } from "./cuisineDetector";
import { analyzeCart } from "./cartIntelligence";

export type { RecommendationResult as Recommendation, RecommendationType, CartContext };

/**
 * Intelligent Recommendation Engine API
 * Replaces the legacy rule-based system with KitcheNette-inspired Graph + Embedding matching.
 */

// Legacy wrapper to support existing code
export function getRecommendations(dishName: string): RecommendationResult[] {
  return scoreRecommendations([dishName], {
    items: [{ name: dishName, price: 0 }],
    timeOfDay: "evening", // default
    weather: "normal" // default
  }, []);
}

// Legacy wrapper to support existing code
export function getCartRecommendations(items: string[], availableItems: string[] = []): RecommendationResult[] {
  if (!items || items.length === 0) return [];

  const context: CartContext = {
    items: items.map(name => ({ name, price: 0 })), // Fake price for old api compatibility
    timeOfDay: new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening",
    weather: "normal" // Could be wired up to an API
  };

  return scoreRecommendations(items, context, availableItems);
}

// Export intelligent sub-systems for future UI expansion
export const intelligentHelpers = {
  detectCuisine,
  analyzeCart
};
