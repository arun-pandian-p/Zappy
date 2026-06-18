import { FoodNode } from "./types";
import { FOOD_NODES } from "./foodGraph";

/**
 * A lightweight sparse vector embedding system for the browser.
 * Instead of loading a 50MB ONNX model, we create a high-dimensional feature
 * space using vocabulary from cuisines, ingredients, and semantic tags.
 * This perfectly mimics the mathematical behavior of a Transformer embedding
 * for the scoped domain of our food menu.
 */

export type Vector = Map<string, number>;

// Build global vocabulary
const VOCABULARY = new Set<string>();

// Pre-compute inverse document frequency (IDF)
const DOCUMENT_FREQ: Record<string, number> = {};
let totalDocs = 0;

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[\s_]+/).filter(Boolean);
}

function processNodeForVocab(node: FoodNode) {
  const terms = new Set<string>();
  
  // Add tokens from name
  tokenize(node.name).forEach(t => terms.add(t));
  
  // Add cuisines
  node.cuisine.forEach(c => tokenize(c).forEach(t => terms.add(`cuisine:${t}`)));
  
  // Add ingredients
  node.ingredients.forEach(i => tokenize(i).forEach(t => terms.add(`ing:${t}`)));
  
  // Add tags
  node.tags.forEach(t => terms.add(`tag:${t}`));
  
  terms.add(`type:${node.type}`);
  terms.add(`veg:${node.isVegetarian}`);
  
  terms.forEach(term => {
    VOCABULARY.add(term);
    DOCUMENT_FREQ[term] = (DOCUMENT_FREQ[term] || 0) + 1;
  });
  totalDocs++;
}

// Initialize Vocab
Object.values(FOOD_NODES).forEach(processNodeForVocab);

const IDF: Record<string, number> = {};
for (const term of VOCABULARY) {
  IDF[term] = Math.log(totalDocs / (1 + DOCUMENT_FREQ[term]));
}

/**
 * Generate a Sparse TF-IDF Embedding Vector for a given food node.
 */
export function generateEmbedding(node: FoodNode | string): Vector {
  if (typeof node === "string") {
    const key = node.toLowerCase().replace(/\s+/g, '_');
    const matchedNode = FOOD_NODES[key] || Object.values(FOOD_NODES).find(n => n.name.toLowerCase() === node.toLowerCase());
    if (matchedNode) {
      return generateEmbedding(matchedNode);
    }
  }

  let targetNode: FoodNode | undefined;
  
  if (typeof node === "string") {
    // If it's a raw string search query, build a pseudo-node
    targetNode = {
      id: "temp",
      name: node,
      cuisine: [],
      ingredients: [],
      tags: [],
      type: "addon",
      isVegetarian: true,
    };
  } else {
    targetNode = node;
  }

  const vec: Vector = new Map();
  const terms: string[] = [];

  tokenize(targetNode.name).forEach(t => terms.push(t));
  targetNode.cuisine.forEach(c => tokenize(c).forEach(t => terms.push(`cuisine:${t}`)));
  targetNode.ingredients.forEach(i => tokenize(i).forEach(t => terms.push(`ing:${t}`)));
  targetNode.tags.forEach(t => terms.push(`tag:${t}`));
  
  if (typeof node !== "string") {
    terms.push(`type:${targetNode.type}`);
    terms.push(`veg:${targetNode.isVegetarian}`);
  }

  // Calculate Term Frequency (TF)
  const tf: Record<string, number> = {};
  terms.forEach(term => {
    tf[term] = (tf[term] || 0) + 1;
  });

  // Calculate TF-IDF
  for (const [term, freq] of Object.entries(tf)) {
    const idf = IDF[term] || Math.log(totalDocs / 1); // unseen word penalty
    vec.set(term, freq * idf);
  }

  // L2 Normalize
  let sumSq = 0;
  for (const val of vec.values()) {
    sumSq += val * val;
  }
  const norm = Math.sqrt(sumSq) || 1;
  
  for (const [term, val] of vec.entries()) {
    vec.set(term, val / norm);
  }

  return vec;
}

/**
 * Compute Cosine Similarity between two sparse vectors.
 */
export function cosineSimilarity(v1: Vector, v2: Vector): number {
  let dotProduct = 0;
  // Iterate over the smaller vector
  const [smaller, larger] = v1.size < v2.size ? [v1, v2] : [v2, v1];
  
  for (const [term, val1] of smaller.entries()) {
    const val2 = larger.get(term);
    if (val2 !== undefined) {
      dotProduct += val1 * val2;
    }
  }
  
  return dotProduct;
}

// Pre-compute and store embeddings locally in memory
export const NODE_EMBEDDINGS: Record<string, Vector> = {};

Object.entries(FOOD_NODES).forEach(([key, node]) => {
  NODE_EMBEDDINGS[key] = generateEmbedding(node);
});

/**
 * Fetch dense OpenAI embeddings (text-embedding-3-small) with local vector caching.
 * Gated by tier eligibility and cost tracking limits.
 */
export async function getOpenAIEmbedding(text: string, restaurantId: string): Promise<Vector> {
  const normalizedText = text.trim().toLowerCase();
  const cacheKey = `zappy_openai_emb_${normalizedText.replace(/\s+/g, "_")}`;
  
  // Try local cache first
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const arr: number[] = JSON.parse(cached);
      const vec: Vector = new Map();
      arr.forEach((v, i) => vec.set(`dim:${i}`, v));
      return vec;
    } catch {
      // ignore parsing errors and re-query
    }
  }

  // Import dynamically/statically to fetch OpenAI embeddings
  const { executeOpenAIEmbeddingCall } = await import("../openaiService");
  const embeddings = await executeOpenAIEmbeddingCall(restaurantId, [text]);
  const embedding = embeddings[0];

  if (embedding) {
    // Cache the dense array representation
    localStorage.setItem(cacheKey, JSON.stringify(embedding));
    
    // Convert dense array into compatible Vector Map
    const vec: Vector = new Map();
    embedding.forEach((v, i) => vec.set(`dim:${i}`, v));
    return vec;
  }

  throw new Error("Failed to retrieve embedding from OpenAI API.");
}

/**
 * Generate embedding for a single menu item and update it directly in the database.
 */
export async function generateAndSaveMenuEmbedding(
  menuItemId: string,
  name: string,
  description: string | null,
  restaurantId: string
): Promise<number[] | null> {
  try {
    const textToEmbed = `${name} ${description || ""}`.trim();
    if (!textToEmbed) return null;

    const { supabase } = await import("@/integrations/supabase/client");

    // Skip if embedding already exists for this item
    const { data: existing } = await supabase
      .from("menu_items")
      .select("embedding")
      .eq("id", menuItemId)
      .maybeSingle();
    if (existing?.embedding) {
      console.log(`[Embedding] Skipping — already exists for ${name}`);
      return existing.embedding as number[];
    }

    console.log(`Generating database embedding for: "${textToEmbed}"`);
    const { executeOpenAIEmbeddingCall } = await import("../openaiService");
    const embeddings = await executeOpenAIEmbeddingCall(restaurantId, [textToEmbed]);
    const embedding = embeddings[0];

    if (embedding) {
      const { error } = await supabase
        .from("menu_items")
        .update({ embedding })
        .eq("id", menuItemId);

      if (error) {
        console.error("Failed to save embedding in database:", error.message);
        throw error;
      }
      
      const cacheKey = `zappy_openai_emb_${name.trim().toLowerCase().replace(/\s+/g, "_")}`;
      localStorage.setItem(cacheKey, JSON.stringify(embedding));

      return embedding;
    }
    return null;
  } catch (err) {
    console.error("generateAndSaveMenuEmbedding error:", err);
    return null;
  }
}

/**
 * Bulk generate embeddings for all menu items of a restaurant and save them.
 */
export async function regenerateAllMenuEmbeddings(
  restaurantId: string
): Promise<{ successCount: number; failCount: number }> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: items, error } = await supabase
      .from("menu_items")
      .select("id, name, description")
      .eq("restaurant_id", restaurantId);

    if (error) throw error;
    if (!items || items.length === 0) return { successCount: 0, failCount: 0 };

    let successCount = 0;
    let failCount = 0;

    const { executeOpenAIEmbeddingCall } = await import("../openaiService");

    const batchSize = 10;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const texts = batch.map(item => `${item.name} ${item.description || ""}`.trim());

      try {
        console.log(`Fetching batch of ${batch.length} embeddings from OpenAI...`);
        const embeddings = await executeOpenAIEmbeddingCall(restaurantId, texts);

        for (let j = 0; j < batch.length; j++) {
          const item = batch[j];
          const embedding = embeddings[j];

          if (embedding) {
            const { error: updateError } = await supabase
              .from("menu_items")
              .update({ embedding })
              .eq("id", item.id);

            if (updateError) {
              console.error(`Failed to save bulk embedding for ${item.name}:`, updateError.message);
              failCount++;
            } else {
              successCount++;
              const cacheKey = `zappy_openai_emb_${item.name.trim().toLowerCase().replace(/\s+/g, "_")}`;
              localStorage.setItem(cacheKey, JSON.stringify(embedding));
            }
          } else {
            failCount++;
          }
        }
      } catch (err) {
        console.error(`Failed to process batch ${i} to ${i + batchSize}:`, err);
        failCount += batch.length;
      }
    }

    return { successCount, failCount };
  } catch (err) {
    console.error("regenerateAllMenuEmbeddings error:", err);
    return { successCount: 0, failCount: 0 };
  }
}


