import { FoodNode, RecommendationResult, CartContext, RecommendationType } from "./types";
import { FOOD_NODES, EXPLICIT_EDGES } from "./foodGraph";
import { generateEmbedding, cosineSimilarity, NODE_EMBEDDINGS } from "./embeddingService";
import { analyzeCart } from "./cartIntelligence";
import { detectCuisine } from "./cuisineDetector";

export interface ScoringWeights {
  semantic: number;
  explicit: number;
  cartGap: number;
  cuisineMatch: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  semantic: 0.4,
  explicit: 0.8, // explicit relationships are trusted highly
  cartGap: 0.3,
  cuisineMatch: 0.2,
};

function resolveDynamicNode(name: string): FoodNode {
  const lower = name.toLowerCase();
  
  // Try to find a matching template in our rich knowledge graph
  for (const node of Object.values(FOOD_NODES)) {
    if (lower.includes(node.name.toLowerCase()) || node.name.toLowerCase().includes(lower)) {
      return { ...node, name: name, id: name }; // Inherit rich properties
    }
  }
  
  // If no template, generate a dynamic node
  const isDrink = lower.includes("drink") || lower.includes("soda") || lower.includes("coffee") || lower.includes("tea") || lower.includes("juice") || lower.includes("lassi") || lower.includes("water") || lower.includes("mojito") || lower.includes("shake") || lower.includes("beer") || lower.includes("wine") || lower.includes("cocktail");
  const isDessert = lower.includes("ice cream") || lower.includes("sweet") || lower.includes("jamun") || lower.includes("cake") || lower.includes("kesari") || lower.includes("brownie") || lower.includes("pudding") || lower.includes("mousse") || lower.includes("donut");
  const isStarter = lower.includes("fry") || lower.includes("tikka") || lower.includes("kebab") || lower.includes("soup") || lower.includes("salad") || lower.includes("wing") || lower.includes("nugget");
  const detectedCuisines = detectCuisine(name);
  
  return {
    id: name,
    name: name,
    cuisine: detectedCuisines.length > 0 ? detectedCuisines : ["Universal"],
    ingredients: [],
    tags: [],
    type: isDrink ? "drink" : isDessert ? "dessert" : isStarter ? "starter" : "addon",
    isVegetarian: !lower.includes("chicken") && !lower.includes("mutton") && !lower.includes("fish") && !lower.includes("egg") && !lower.includes("prawn") && !lower.includes("meat") && !lower.includes("beef") && !lower.includes("pork"),
  };
}

/**
 * Core Scoring Engine replacing standard static lookups.
 * Blends graph edges with TF-IDF similarity.
 */
export function scoreRecommendations(
  targetItems: string[],
  context: CartContext,
  availableMenuNames: string[]
): RecommendationResult[] {
  const scores = new Map<string, RecommendationResult>();

  // Extract cart intelligence
  const cartInfo = analyzeCart(context);
  const targetEmbeddings = targetItems.map(item => generateEmbedding(item));

  // Determine candidate pool
  // If the restaurant provides a specific menu, ONLY recommend those items.
  // Otherwise, fallback to the generic FOOD_NODES.
  const candidateNodes: FoodNode[] = availableMenuNames.length > 0
    ? availableMenuNames.map(resolveDynamicNode)
    : Object.values(FOOD_NODES);

  const normalizedTargetNames = targetItems.map(t => t.toLowerCase());

  for (const node of candidateNodes) {
    // Prevent recommending what's already in the cart
    if (normalizedTargetNames.some(t => t.includes(node.name.toLowerCase()) || node.name.toLowerCase().includes(t))) {
      continue;
    }

    let totalScore = 0;
    let reason = "Chef's recommendation";
    let confidence = 0;
    
    // 1. Semantic Similarity (Average similarity across all cart items)
    const nodeEmb = generateEmbedding(node);
    let maxSim = 0;
    for (const tEmb of targetEmbeddings) {
      const sim = cosineSimilarity(tEmb, nodeEmb);
      if (sim > maxSim) maxSim = sim;
    }
    
    // If it's a dynamic node without rich tags, similarity might be lower naturally, but that's fine.
    totalScore += maxSim * DEFAULT_WEIGHTS.semantic;

    if (maxSim > 0.4) {
      reason = `Pairs well with your order`;
      confidence = Math.max(confidence, maxSim);
    }

    // 2. Explicit Graph Edges (Highly weighted)
    // We check if the dynamic node maps to any explicit target edge
    for (const edge of EXPLICIT_EDGES) {
      const sourceNodeTemplate = FOOD_NODES[edge.source];
      const targetNodeTemplate = FOOD_NODES[edge.target];
      
      // Is an item in the cart matching the source?
      const cartHasSource = sourceNodeTemplate && normalizedTargetNames.some(t => t.includes(sourceNodeTemplate.name.toLowerCase()));
      // Is this candidate matching the target?
      const candidateIsTarget = targetNodeTemplate && node.name.toLowerCase().includes(targetNodeTemplate.name.toLowerCase());
      
      if (cartHasSource && candidateIsTarget) {
        totalScore += edge.weight * DEFAULT_WEIGHTS.explicit;
        reason = edge.reason;
        confidence = Math.max(confidence, edge.weight);
      }
    }

    // 3. Cart Gap Analysis (e.g. missing drink)
    if (cartInfo.missingTypes.includes(node.type)) {
      totalScore += DEFAULT_WEIGHTS.cartGap;
      if (node.type === "drink") reason = "Quench your thirst";
      if (node.type === "dessert") reason = "Sweet finish to your meal";
      confidence = Math.max(confidence, 0.6);
    }

    // 4. Cuisine Affinity
    if (cartInfo.dominantCuisine && node.cuisine.includes(cartInfo.dominantCuisine as any)) {
      totalScore += DEFAULT_WEIGHTS.cuisineMatch;
    }

    // 5. Personalization Filters
    if (cartInfo.isVegetarian && !node.isVegetarian) {
      // Strict rule: never recommend non-veg to a strict veg cart
      continue; 
    }

    // Only keep decent scores
    // Lowered threshold slightly for dynamic menus to ensure we always show something
    if (totalScore > 0.15) {
      let category: any = "Trending Add-ons";
      if (confidence > 0.9) category = "Pairs Perfectly";
      else if (totalScore > 0.8) category = "Frequently Bought Together";
      else if (node.type === "combo") category = "Popular Combo";
      else if (Math.random() > 0.8) category = "Customers Also Ordered";
      else if (node.tags?.includes("chef_special")) category = "Chef Recommended";

      const relationBadge = node.type === "drink" ? "Beverage" : node.type === "side" ? "Perfect Side" : "Add-on";

      scores.set(node.id, {
        id: node.id,
        name: node.name,
        score: totalScore,
        confidence: Math.min(1.0, confidence + 0.1),
        cuisine: node.cuisine[0] || "Universal",
        type: node.type,
        reason: reason,
        ingredientsMatched: node.ingredients,
        popularity: Math.random() * 0.5 + 0.5,
        category: category,
        relationBadge: relationBadge,
        comboSavings: node.type === "combo" ? Math.floor(Math.random() * 20) + 10 : undefined,
        isBestseller: Math.random() > 0.7,
        isChefSpecial: node.tags?.includes("chef_special") || false,
      });
    }
  }

  // Sort by score
  const results = Array.from(scores.values()).sort((a, b) => b.score - a.score);

  // Return top 4 distinct recommendations
  return results.slice(0, 4);
}
