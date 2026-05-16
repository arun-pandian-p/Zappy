import { RecommendationResult, CartContext, RecommendationType } from "./types";
import { scoreRecommendations } from "./scoringEngine";
import { detectCuisine } from "./cuisineDetector";
import { analyzeCart } from "./cartIntelligence";
import { FOOD_NODES, EXPLICIT_EDGES } from "./foodGraph";

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
  analyzeCart,
  /**
   * Direct Node Lookup
   * Useful for finding rich metadata for a specific food item.
   */
  lookupNode: (name: string) => {
    const lower = name.toLowerCase();
    return Object.values(FOOD_NODES).find((n: any) => 
      lower.includes(n.name.toLowerCase()) || 
      n.name.toLowerCase().includes(lower) ||
      n.id === lower
    );
  }
};

/**
 * Direct Static Lookup
 * Given an item name, returns its explicit graph pairings immediately.
 */
export function getExplicitLookup(itemName: string): RecommendationResult[] {
  const node = intelligentHelpers.lookupNode(itemName);
  if (!node) return [];

  const edges = EXPLICIT_EDGES.filter(e => e.source === node.id);
  
  return edges.map(edge => {
    const target = FOOD_NODES[edge.target];
    return {
      id: edge.target,
      name: target?.name || edge.target,
      score: edge.weight,
      confidence: edge.weight,
      cuisine: target?.cuisine[0] || "Universal",
      type: edge.type,
      reason: edge.reason,
      ingredientsMatched: target?.ingredients || [],
      popularity: 0.9,
      category: "Pairs Perfectly",
      relationBadge: edge.type === "drink" ? "Beverage" : edge.type === "side" ? "Perfect Side" : "Add-on"
    };
  });
}
