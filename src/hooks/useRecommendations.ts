import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FOOD_NODES, EXPLICIT_EDGES } from "@/services/recommendations/foodGraph";
import type { MenuItem } from "./useMenuItems";

export interface Recommendation {
  item: MenuItem;
  reason: string;
  confidence: number;
  category: string;
}

async function getDenseEmbedding(text: string, restaurantId: string): Promise<number[] | null> {
  const normalizedText = text.trim().toLowerCase();
  const cacheKey = `zappy_openai_emb_${normalizedText.replace(/\s+/g, "_")}`;
  
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }

  try {
    // Instead of calling OpenAI, fetch the pre-computed embedding from the database (Rule 7 & 8)
    const { data, error } = await supabase
      .from("menu_items")
      .select("embedding")
      .eq("restaurant_id", restaurantId)
      .ilike("name", normalizedText)
      .maybeSingle();

    if (!error && data?.embedding) {
      const embedding = data.embedding as any;
      const embArray = typeof embedding === "string" ? JSON.parse(embedding) : (embedding as number[]);
      localStorage.setItem(cacheKey, JSON.stringify(embArray));
      return embArray;
    }
  } catch (err) {
    console.warn("Failed to fetch pre-computed embedding from DB:", err);
  }
  return null;
}

export function useRecommendations(cartItems: string[], restaurantId?: string) {
  return useQuery({
    queryKey: ["recommendations", restaurantId, cartItems.join(",")],
    queryFn: async (): Promise<Recommendation[]> => {
      if (!restaurantId) return [];

      // 1. Fetch all available menu items for the restaurant
      const { data: menuItems, error: menuError } = await supabase
        .from("menu_items")
        .select("*, category:categories(id, name, display_order)")
        .eq("restaurant_id", restaurantId)
        .eq("is_available", true);

      if (menuError) throw menuError;
      if (!menuItems || menuItems.length === 0) return [];

      const normalizedCartNames = cartItems.map(item => item.toLowerCase().trim());
      const isCartVegetarian = normalizedCartNames.length > 0 && menuItems
        .filter(item => normalizedCartNames.includes(item.name.toLowerCase().trim()))
        .every(item => item.is_vegetarian);

      // Filter out items already in the cart and handle veg/non-veg constraints
      const candidates = menuItems.filter(item => {
        const nameLower = item.name.toLowerCase().trim();
        const inCart = normalizedCartNames.some(cartName => 
          cartName.includes(nameLower) || nameLower.includes(cartName)
        );
        if (inCart) return false;

        // Personalization: If the cart is strictly vegetarian, filter out non-veg recommendations
        if (isCartVegetarian && !item.is_vegetarian) return false;

        return true;
      });

      if (candidates.length === 0) return [];

      const recommendationsMap = new Map<string, Recommendation>();

      // 2. EMPTY CART STATE: Recommend popular/trending items as fallback
      if (cartItems.length === 0) {
        const popularItems = candidates
          .filter(item => item.is_popular)
          .slice(0, 4);

        const itemsToUse = popularItems.length >= 2 ? popularItems : candidates.slice(0, 4);

        return itemsToUse.map(item => ({
          item,
          reason: "Chef's popular choice",
          confidence: 0.8,
          category: "Trending Dishes",
        }));
      }

      // 3. EXPLICIT RULE-BASED LAYER (Prioritized)
      // Check explicit pairing rules from our food graph
      for (const cartItem of cartItems) {
        const cartItemLower = cartItem.toLowerCase().trim();
        
        // Find matching source node key in FOOD_NODES
        const sourceNodeKey = Object.keys(FOOD_NODES).find(key => {
          const node = FOOD_NODES[key];
          return cartItemLower.includes(node.name.toLowerCase()) || node.name.toLowerCase().includes(cartItemLower);
        });

        if (sourceNodeKey) {
          const matchingEdges = EXPLICIT_EDGES.filter(edge => edge.source === sourceNodeKey);
          for (const edge of matchingEdges) {
            const targetNode = FOOD_NODES[edge.target];
            if (targetNode) {
              // Check if we have this target item available in our candidate pool
              const candidate = candidates.find(c => 
                c.name.toLowerCase().includes(targetNode.name.toLowerCase()) || 
                targetNode.name.toLowerCase().includes(c.name.toLowerCase())
              );

              if (candidate && !recommendationsMap.has(candidate.id)) {
                recommendationsMap.set(candidate.id, {
                  item: candidate,
                  reason: edge.reason,
                  confidence: edge.weight,
                  category: edge.weight > 0.9 ? "Pairs Perfectly" : "Frequently Bought Together",
                });
              }
            }
          }
        }
      }

      // 4. DATABASE VECTOR SEARCH LAYER
      try {
        // Retrieve embeddings for all cart items and average them
        const embeddingPromises = cartItems.map(item => getDenseEmbedding(item, restaurantId));
        const embeddings = (await Promise.all(embeddingPromises)).filter((emb): emb is number[] => emb !== null);

        if (embeddings.length > 0) {
          // Average the embeddings to construct the query vector
          const dimensions = embeddings[0].length;
          const queryEmbedding = new Array(dimensions).fill(0);
          
          for (const emb of embeddings) {
            for (let d = 0; d < dimensions; d++) {
              queryEmbedding[d] += emb[d];
            }
          }
          
          for (let d = 0; d < dimensions; d++) {
            queryEmbedding[d] /= embeddings.length;
          }

          // Call the RPC for cosine similarity match
          const { data: matchedItems, error: rpcError } = await supabase.rpc("match_menu_items", {
            query_embedding: queryEmbedding,
            match_threshold: 0.35,
            match_count: 5,
            r_id: restaurantId,
          });

          if (!rpcError && matchedItems) {
            for (const match of matchedItems) {
              const candidate = candidates.find(c => c.id === match.id);
              if (candidate && !recommendationsMap.has(candidate.id)) {
                recommendationsMap.set(candidate.id, {
                  item: candidate,
                  reason: "Pairs well with your order",
                  confidence: match.similarity,
                  category: match.similarity > 0.8 ? "Pairs Perfectly" : "Customers Also Ordered",
                });
              }
            }
          } else if (rpcError) {
            console.error("Vector RPC match error:", rpcError.message);
          }
        }
      } catch (vectorErr) {
        console.warn("Vector search failed, falling back to graph/popular matches:", vectorErr);
      }

      // 5. FALLBACK LAYER: Ensure we have at least 3 recommendations if candidates are available
      const results = Array.from(recommendationsMap.values());
      if (results.length < 3) {
        const remainingCandidates = candidates.filter(c => !recommendationsMap.has(c.id));
        
        // Prioritize popular items first
        remainingCandidates.sort((a, b) => (b.is_popular ? 1 : 0) - (a.is_popular ? 1 : 0));

        for (const candidate of remainingCandidates) {
          if (results.length >= 4) break;
          results.push({
            item: candidate,
            reason: "Popular addition",
            confidence: 0.5,
            category: "Trending Add-ons",
          });
        }
      }

      // Sort final list by confidence
      return results.sort((a, b) => b.confidence - a.confidence).slice(0, 4);
    },
    enabled: !!restaurantId,
    staleTime: 30 * 1000, // 30 seconds caching for recommendation query
  });
}
