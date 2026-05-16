import { CuisineType } from "./types";

/**
 * Intelligent Cuisine Detection
 * Maps keywords, transliterations, and multi-lingual terms to Cuisine Types.
 */
const CUISINE_MAP: Record<string, CuisineType> = {
  // South Indian
  "idli": "South Indian",
  "dosa": "South Indian",
  "sambar": "South Indian",
  "vada": "South Indian",
  "uthappam": "South Indian",
  "தோசை": "South Indian", // Tamil dosa
  "பிரியாணி": "South Indian", // Tamil biryani
  "parotta": "South Indian",
  "porotta": "South Indian",
  "chettinad": "South Indian",
  "filter coffee": "South Indian",

  // North Indian
  "paneer": "North Indian",
  "butter masala": "North Indian",
  "naan": "North Indian",
  "roti": "North Indian",
  "tikka": "North Indian",
  "chole": "North Indian",
  "bhature": "North Indian",
  "korma": "North Indian",

  // Mughlai
  "biryani": "Mughlai",
  "kebab": "Mughlai",
  "haleem": "Mughlai",
  "falooda": "Mughlai",

  // Fast Food / Street Food
  "burger": "Fast Food",
  "fries": "Fast Food",
  "pizza": "Fast Food",
  "chaat": "Street Food",
  "samosa": "Street Food",
  "bajji": "Street Food",

  // Chinese
  "noodles": "Chinese",
  "fried rice": "Chinese",
  "manchurian": "Chinese",
  "chilli": "Chinese",
  "spring roll": "Chinese",

  // Italian
  "pasta": "Italian",
  "garlic bread": "Italian",
};

/**
 * Auto-detect cuisine based on food name using fuzzy keyword extraction.
 */
export function detectCuisine(foodName: string): CuisineType[] {
  const normalized = foodName.toLowerCase();
  const detected = new Set<CuisineType>();

  // Direct word match
  for (const [keyword, cuisine] of Object.entries(CUISINE_MAP)) {
    if (normalized.includes(keyword)) {
      detected.add(cuisine);
    }
  }

  // Fallback
  if (detected.size === 0) {
    if (normalized.includes("drink") || normalized.includes("soda") || normalized.includes("juice")) {
      detected.add("Beverage");
    } else if (normalized.includes("ice cream") || normalized.includes("sweet")) {
      detected.add("Dessert");
    } else {
      detected.add("Universal");
    }
  }

  return Array.from(detected);
}
