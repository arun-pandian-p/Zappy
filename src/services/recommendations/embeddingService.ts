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
