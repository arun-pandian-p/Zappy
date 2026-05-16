/**
 * Menu Parser Service
 * Parses raw OCR text into structured menu item JSON.
 * Runs 100% locally — no AI APIs used.
 */

import { fixOCRTypos, extractPrice, titleCase, deduplicateItems } from "./textCleaner";

export interface ParsedMenuItem {
  name: string;
  price: number;
  category: string;
  description: string;
  confidence: number;
}

// Category keywords for auto-classification
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Breakfast": [
    "idli", "dosa", "vada", "upma", "pongal", "uttappam", "puttu", "appam",
    "poha", "paratha", "aloo paratha", "toast", "omelette", "egg",
    "breakfast", "morning", "tiffin",
  ],
  "Starters": [
    "starter", "appetizer", "pakoda", "bajji", "samosa", "tikka", "kebab",
    "manchurian", "65", "fry", "cutlet", "roll", "spring roll",
    "paneer tikka", "chicken 65", "gobi", "crispy",
  ],
  "Soups": [
    "soup", "shorba", "broth", "rasam",
  ],
  "Main Course": [
    "curry", "masala", "gravy", "korma", "rogan josh", "butter chicken",
    "paneer", "dal", "chettinad", "kadai", "vindaloo", "malai",
    "main course", "main", "entrée", "entree",
  ],
  "Rice & Breads": [
    "biryani", "rice", "pulao", "fried rice", "jeera rice", "curd rice",
    "naan", "roti", "chapati", "parotta", "kulcha", "bread", "tandoori roti",
  ],
  "Snacks": [
    "snack", "chaat", "pani puri", "bhel", "sandwich", "burger", "pizza",
    "fries", "french fries", "nuggets", "momos", "shawarma", "wrap",
  ],
  "Drinks": [
    "juice", "lassi", "coffee", "tea", "chai", "lime", "soda", "shake",
    "smoothie", "milkshake", "buttermilk", "drink", "beverage", "water",
    "cold", "hot",
  ],
  "Desserts": [
    "dessert", "sweet", "gulab jamun", "rasmalai", "ice cream", "kulfi",
    "halwa", "kesari", "payasam", "kheer", "jalebi", "rasgulla",
    "brownie", "cake", "pudding",
  ],
};

// Lines that should be ignored (headers, footers, junk)
const IGNORE_PATTERNS = [
  /^\s*menu\s*$/i,
  /^\s*food\s*menu\s*$/i,
  /^\s*price\s*list\s*$/i,
  /^\s*restaurant\s*$/i,
  /^\s*hotel\s*$/i,
  /^\s*welcome\s*/i,
  /^\s*thank\s*you/i,
  /^\s*order\s*online/i,
  /^\s*delivery/i,
  /^\s*timing/i,
  /^\s*hours/i,
  /^\s*address/i,
  /^\s*phone/i,
  /^\s*call/i,
  /^\s*gst/i,
  /^\s*fssai/i,
  /^\s*tax/i,
  /^\s*note\s*:/i,
  /^\s*disclaimer/i,
  /^\s*all\s+prices/i,
  /^\s*subject\s+to/i,
  /^\s*page\s+\d/i,
  /^\s*\*{2,}/,          // Row of asterisks
  /^\s*-{3,}/,           // Row of dashes
  /^\s*={3,}/,           // Row of equals
  /^\s*#{3,}/,           // Row of hashes
];

/**
 * Detect category from item name using keyword matching
 */
function detectCategory(itemName: string, contextCategory?: string): string {
  const lower = itemName.toLowerCase();

  // Try to match keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category;
      }
    }
  }

  // Fall back to context category if available
  if (contextCategory) return contextCategory;

  return "Main Course"; // Default
}

/**
 * Check if a line looks like a category header
 */
function isCategoryHeader(line: string): string | null {
  const trimmed = line.trim();

  // Skip empty or very short lines
  if (trimmed.length < 3) return null;

  // Check if it matches known categories
  for (const category of Object.keys(CATEGORY_KEYWORDS)) {
    if (trimmed.toLowerCase() === category.toLowerCase()) {
      return category;
    }
  }

  // Common category headers
  const categoryHeaders = [
    "starters", "appetizers", "soups", "salads",
    "main course", "mains", "entrées", "entrees",
    "rice", "breads", "rice & breads", "rice and breads",
    "biryani", "biryanis",
    "breakfast", "tiffin", "morning specials",
    "snacks", "quick bites",
    "beverages", "drinks", "juices",
    "desserts", "sweets", "ice cream",
    "non-veg", "non veg", "vegetarian", "veg",
    "tandoor", "chinese", "continental",
    "special", "specials", "chef's special",
  ];

  const lower = trimmed.toLowerCase();
  for (const header of categoryHeaders) {
    if (lower === header || lower === header + "s" || lower === header.slice(0, -1)) {
      // Map to standard categories
      if (["appetizers", "starters"].includes(lower)) return "Starters";
      if (["beverages", "drinks", "juices"].includes(lower)) return "Drinks";
      if (["sweets", "ice cream"].includes(lower)) return "Desserts";
      if (["mains", "entrées", "entrees"].includes(lower)) return "Main Course";
      if (["tiffin", "morning specials"].includes(lower)) return "Breakfast";
      if (["quick bites"].includes(lower)) return "Snacks";
      return titleCase(header);
    }
  }

  // ALL CAPS lines without prices are likely headers
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !extractPrice(trimmed)) {
    return titleCase(trimmed);
  }

  return null;
}

/**
 * Check if a line should be ignored
 */
function shouldIgnoreLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 2) return true;

  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  return false;
}

/**
 * Parse a single line into a menu item
 * Handles formats like:
 *   "Masala Dosa  ₹120"
 *   "Masala Dosa ... 120"
 *   "Masala Dosa - 120"
 *   "120 Masala Dosa"
 */
function parseMenuLine(line: string, currentCategory: string): ParsedMenuItem | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 3) return null;

  // Try to find price in the line
  // Pattern 1: Name ... Price (most common)
  const patterns = [
    // "Item Name ₹120" or "Item Name Rs.120" or "Item Name 120"
    /^(.+?)[\s.…_-]+(?:₹|Rs\.?\s*|INR\s*)?(\d+(?:\.\d{1,2})?)(?:\s*\/?-?\s*)?$/i,
    // "₹120 Item Name" (price first)
    /^(?:₹|Rs\.?\s*|INR\s*)?(\d+(?:\.\d{1,2})?)\s+(.+)$/i,
    // "Item Name | 120" (pipe separated)
    /^(.+?)\s*\|\s*(?:₹|Rs\.?\s*)?(\d+(?:\.\d{1,2})?)$/i,
    // "Item Name, 120" (comma separated)
    /^(.+?)\s*,\s*(?:₹|Rs\.?\s*)?(\d+(?:\.\d{1,2})?)\s*$/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      let name: string;
      let priceStr: string;

      // Check if price is first or last
      if (pattern === patterns[1]) {
        priceStr = match[1];
        name = match[2];
      } else {
        name = match[1];
        priceStr = match[2];
      }

      const price = extractPrice(priceStr);
      if (!price) continue;

      // Clean and validate name
      name = fixOCRTypos(name.trim());
      name = name.replace(/[.…_-]+$/, "").trim(); // Remove trailing dots/dashes
      name = titleCase(name);

      // Skip if name is too short or looks like junk
      if (name.length < 2) continue;
      if (/^\d+$/.test(name)) continue; // Pure numbers

      const category = detectCategory(name, currentCategory);

      return {
        name,
        price,
        category,
        description: "",
        confidence: 0.85,
      };
    }
  }

  return null;
}

/**
 * Parse raw OCR text into structured menu items
 */
export function parseMenuFromText(rawText: string): ParsedMenuItem[] {
  const lines = rawText.split("\n");
  const items: ParsedMenuItem[] = [];
  let currentCategory = "Main Course";

  for (const line of lines) {
    if (shouldIgnoreLine(line)) continue;

    // Check if this line is a category header
    const categoryHeader = isCategoryHeader(line);
    if (categoryHeader) {
      currentCategory = categoryHeader;
      continue;
    }

    // Try to parse as a menu item
    const item = parseMenuLine(line, currentCategory);
    if (item) {
      items.push(item);
    }
  }

  return deduplicateItems(items);
}

/**
 * Parse CSV/tabular text into structured menu items
 * Handles both comma-separated and tab-separated formats
 */
export function parseMenuFromCSV(csvText: string): ParsedMenuItem[] {
  const lines = csvText.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];

  const items: ParsedMenuItem[] = [];
  const headerLine = lines[0].toLowerCase();

  // Detect column indices from header
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const nameIdx = headers.findIndex(h => ["item", "item name", "name", "dish", "food", "product"].includes(h));
  const priceIdx = headers.findIndex(h => ["price", "cost", "amount", "rate", "mrp"].includes(h));
  const catIdx = headers.findIndex(h => ["category", "cat", "type", "section", "group"].includes(h));
  const descIdx = headers.findIndex(h => ["description", "desc", "details", "info"].includes(h));

  // If we can't detect proper headers, try parsing as free text
  if (nameIdx === -1 || priceIdx === -1) {
    return parseMenuFromText(csvText);
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (!cols || cols.length <= Math.max(nameIdx, priceIdx)) continue;

    const name = fixOCRTypos(cols[nameIdx]?.trim() || "");
    const price = extractPrice(cols[priceIdx] || "");
    const rawCategory = catIdx >= 0 ? cols[catIdx]?.trim() || "" : "";
    const description = descIdx >= 0 ? cols[descIdx]?.trim() || "" : "";

    if (!name || !price) continue;

    const category = rawCategory
      ? titleCase(rawCategory)
      : detectCategory(name);

    items.push({
      name: titleCase(name),
      price,
      category,
      description,
      confidence: 0.95, // CSV data is more reliable
    });
  }

  return deduplicateItems(items);
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}
