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
  const cuisines = detectCuisine(name);
  const isDrink = lower.includes("drink") || lower.includes("soda") || lower.includes("coffee") || lower.includes("tea") || lower.includes("juice") || lower.includes("lassi");
  const isDessert = lower.includes("ice cream") || lower.includes("sweet") || lower.includes("jamun") || lower.includes("cake") || lower.includes("kesari");
  
  return {
    id: name,
    name: name,
    cuisine: cuisines.length > 0 ? cuisines : ["Universal"],
    ingredients: [],
    tags: [],
    type: isDrink ? "drink" : isDessert ? "dessert" : "addon",
    isVegetarian: !lower.includes("chicken") && !lower.includes("mutton") && !lower.includes("fish") && !lower.includes("egg") && !lower.includes("prawn"),
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
      // Heavy penalty for showing non-veg to strict veg cart
      totalScore -= 2.0; 
    }

    // Only keep decent scores
    // Lowered threshold slightly for dynamic menus to ensure we always show something
    if (totalScore > 0.15) {
      scores.set(node.id, {
        id: node.id,
        name: node.name,
        score: totalScore,
        confidence: Math.min(1.0, confidence + 0.1), // boost confidence slightly due to multiple signals
        cuisine: node.cuisine[0] || "Universal",
        type: node.type,
        reason: reason,
        ingredientsMatched: node.ingredients,
        popularity: Math.random() * 0.5 + 0.5, // Mock popularity metric
      });
    }
  }

  // Sort by score
  const results = Array.from(scores.values()).sort((a, b) => b.score - a.score);

  // Return top 4 distinct recommendations
  return results.slice(0, 4);
}
