export type CuisineType = 
  | "South Indian"
  | "North Indian"
  | "Chinese"
  | "Italian"
  | "Fast Food"
  | "Street Food"
  | "Mughlai"
  | "Continental"
  | "Beverage"
  | "Dessert"
  | "Universal";

export type RecommendationType = 
  | "addon" 
  | "combo" 
  | "drink" 
  | "dessert" 
  | "starter" 
  | "side" 
  | "premium" 
  | "chef_special";

export type RecommendationCategory = 
  | "Pairs Perfectly"
  | "Frequently Bought Together"
  | "Chef Recommended"
  | "Trending Add-ons"
  | "Popular Combo"
  | "Customers Also Ordered";

export interface FoodNode {
  id: string;
  name: string;
  cuisine: CuisineType[];
  ingredients: string[];
  tags: string[]; // e.g., spicy, creamy, crispy, cold, hot
  type: RecommendationType;
  isVegetarian: boolean;
  basePrice?: number;
  mealType?: string[];
  recommendedWith?: string[];
  pairingTags?: string[];
  comboPriority?: number;
  upsellPriority?: number;
  frequentlyBoughtTogether?: string[];

export interface Edge {
  source: string; // FoodNode ID
  target: string; // FoodNode ID
  weight: number; // 0.0 to 1.0
  reason: string;
  type: RecommendationType;
}

export interface RecommendationResult {
  id: string; // The menu item ID
  name: string;
  score: number;
  confidence: number;
  cuisine: string;
  type: RecommendationType;
  reason: string;
  ingredientsMatched: string[];
  popularity: number;
  category: RecommendationCategory;
  relationBadge: string;
  comboSavings?: number;
  isBestseller?: boolean;
  isChefSpecial?: boolean;

export interface CartContext {
  items: Array<{ name: string; price: number; isVegetarian?: boolean }>;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  weather: "hot" | "cold" | "rainy" | "normal"; // Mock weather for now
}
