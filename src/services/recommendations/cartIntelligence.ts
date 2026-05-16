import { CartContext, RecommendationType, FoodNode } from "./types";
import { FOOD_NODES } from "./foodGraph";

export interface CartIntelligenceResult {
  missingTypes: RecommendationType[];
  dominantCuisine: string | null;
  isVegetarian: boolean;
  suggestions: string[];
}

/**
 * Analyzes the cart to find gaps (missing drinks, desserts, protein imbalance).
 */
export function analyzeCart(context: CartContext): CartIntelligenceResult {
  const items = context.items;
  
  let hasDrink = false;
  let hasDessert = false;
  let hasMain = false;
  let hasSide = false;
  
  let vegCount = 0;
  const cuisines: Record<string, number> = {};

  items.forEach(item => {
    // Find approximate node
    const normalizedName = item.name.toLowerCase();
    const nodeMatch = Object.values(FOOD_NODES).find(n => normalizedName.includes(n.id) || normalizedName.includes(n.name.toLowerCase()));
    
    if (nodeMatch) {
      if (nodeMatch.type === "drink") hasDrink = true;
      if (nodeMatch.type === "dessert") hasDessert = true;
      if (nodeMatch.type === "combo") hasMain = true;
      if (nodeMatch.type === "side") hasSide = true;
      
      if (nodeMatch.isVegetarian) vegCount++;
      
      nodeMatch.cuisine.forEach(c => {
        cuisines[c] = (cuisines[c] || 0) + 1;
      });
    } else {
      // Basic heuristics if not in graph
      if (normalizedName.includes("drink") || normalizedName.includes("soda") || normalizedName.includes("coffee") || normalizedName.includes("tea")) {
        hasDrink = true;
      }
      if (normalizedName.includes("ice cream") || normalizedName.includes("jamun") || normalizedName.includes("sweet")) {
        hasDessert = true;
      }
      if (item.isVegetarian) vegCount++;
    }
  });

  const missingTypes: RecommendationType[] = [];
  
  // Rules for missing items
  if (!hasDrink) missingTypes.push("drink");
  if (!hasDessert && items.length > 1) missingTypes.push("dessert"); // only suggest dessert for larger meals
  if (hasMain && !hasSide) missingTypes.push("side");
  if (hasSide && !hasMain) missingTypes.push("addon");

  // Contextual rules
  if (context.weather === "rainy" && !hasDrink) {
    missingTypes.push("drink"); // prioritize hot drinks
  }

  // Dominant cuisine
  let dominantCuisine: string | null = null;
  let maxCount = 0;
  for (const [c, count] of Object.entries(cuisines)) {
    if (count > maxCount) {
      maxCount = count;
      dominantCuisine = c;
    }
  }

  return {
    missingTypes,
    dominantCuisine,
    isVegetarian: vegCount === items.length && items.length > 0,
    suggestions: [],
  };
}
