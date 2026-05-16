/**
 * Text Cleaner Utility
 * Fixes common OCR typos, normalizes text, and cleans extracted content.
 * Runs 100% locally — no AI APIs used.
 */

// Common OCR misreads for food items (character substitutions)
const OCR_TYPO_MAP: Record<string, string> = {
  // Number → Letter substitutions
  "1dli": "Idli",
  "1DLI": "Idli",
  "D0sa": "Dosa",
  "d0sa": "Dosa",
  "D0SA": "Dosa",
  "Bi ryani": "Biryani",
  "Bi-ryani": "Biryani",
  "biryam": "Biryani",
  "N4an": "Naan",
  "na4n": "Naan",
  "Par0tta": "Parotta",
  "par0tta": "Parotta",
  "Chap4ti": "Chapati",
  "sarn0sa": "Samosa",
  "sam0sa": "Samosa",
  "Ras9am": "Rasam",
  "Pul4v": "Pulav",
  "pu1av": "Pulav",
  "Upp9a": "Upma",
  "Ut4appam": "Uttappam",
  "Vadai": "Vada",
  "l<urma": "Kurma",
  "Baji": "Bajji",
  "Pa1ak": "Palak",
  "Chick3n": "Chicken",
  "ch1cken": "Chicken",
  "Mutt0n": "Mutton",
  "mutt0n": "Mutton",
  "F1sh": "Fish",
  "Pra\/vn": "Prawn",
  "lassi": "Lassi",
  "1assi": "Lassi",
  "c0ffee": "Coffee",
  "C0ffee": "Coffee",
  "Ju1ce": "Juice",
  "ju1ce": "Juice",
};

// Character-level substitution patterns
const CHAR_FIXES: [RegExp, string][] = [
  [/(\b)0(\w)/g, "$1O$2"],  // Leading 0 → O
  [/(\w)0(\b)/g, "$1o$2"],  // Trailing 0 → o
  [/(\b)1(\w{2,})/g, "$1I$2"], // Leading 1 → I in words
  [/(\w)1(\w)/g, "$1l$2"],  // Mid 1 → l
  [/\|/g, "l"],              // Pipe → l
  [/rn/g, "m"],              // rn → m (common OCR error)
];

/**
 * Fix known OCR typos in a food item name
 */
export function fixOCRTypos(text: string): string {
  let fixed = text.trim();

  // Direct word replacements
  for (const [typo, correction] of Object.entries(OCR_TYPO_MAP)) {
    const regex = new RegExp(typo, "gi");
    fixed = fixed.replace(regex, correction);
  }

  return fixed;
}

/**
 * Normalize currency symbols and extract numeric price
 */
export function extractPrice(priceStr: string): number | null {
  if (!priceStr) return null;

  // Remove currency symbols and whitespace
  let cleaned = priceStr
    .replace(/[₹$€£¥]/g, "")
    .replace(/Rs\.?/gi, "")
    .replace(/INR/gi, "")
    .replace(/MRP/gi, "")
    .replace(/\/-/g, "")
    .replace(/[,\s]/g, "")
    .trim();

  // Try to extract a number
  const match = cleaned.match(/(\d+(?:\.\d{1,2})?)/);
  if (match) {
    const price = parseFloat(match[1]);
    // Sanity check: menu items are usually ₹10 - ₹5000
    if (price >= 1 && price <= 10000) {
      return price;
    }
  }
  return null;
}

/**
 * Clean OCR text — remove junk lines, normalize whitespace
 */
export function cleanOCRText(rawText: string): string {
  return rawText
    // Normalize line endings
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Remove excessive whitespace
    .replace(/[ \t]+/g, " ")
    // Remove common OCR noise
    .replace(/[|{}[\]\\]/g, "")
    // Remove lines that are just numbers (page numbers, etc.)
    .replace(/^\s*\d{1,3}\s*$/gm, "")
    // Remove phone numbers
    .replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, "")
    // Remove email addresses
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, "")
    // Remove URLs
    .replace(/https?:\/\/\S+/g, "")
    // Remove GST/tax numbers
    .replace(/GST\s*:?\s*\w+/gi, "")
    .replace(/FSSAI\s*:?\s*\w+/gi, "")
    // Remove "All prices inclusive of..." disclaimers
    .replace(/all\s+prices?\s+(are\s+)?inclusive.*$/gim, "")
    .replace(/prices?\s+subject\s+to.*$/gim, "")
    .replace(/taxes?\s+(extra|additional|applicable).*$/gim, "")
    .trim();
}

/**
 * Capitalize a food item name properly
 */
export function titleCase(text: string): string {
  const lowercaseWords = new Set(["and", "or", "the", "in", "on", "with", "a", "an", "of", "for"]);

  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index === 0 || !lowercaseWords.has(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(" ");
}

/**
 * Remove duplicate items (by normalized name)
 */
export function deduplicateItems<T extends { name: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = item.name.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Simple local description generator (no AI)
 */
export function generateLocalDescription(itemName: string, category: string): string {
  const descriptors: Record<string, string[]> = {
    "Starters": ["Crispy and delicious", "A perfect appetizer", "Freshly prepared"],
    "Breakfast": ["A classic morning favorite", "Start your day with this", "Fresh and wholesome"],
    "Main Course": ["A hearty and satisfying dish", "Cooked to perfection", "Rich and flavorful"],
    "Soups": ["Warm and comforting", "A soothing bowl of goodness", "Freshly prepared"],
    "Rice & Breads": ["Perfectly cooked", "A staple accompaniment", "Freshly made"],
    "Snacks": ["A tasty snack", "Crispy and savory", "Perfect for anytime"],
    "Drinks": ["Refreshing and cool", "A delightful beverage", "Freshly prepared"],
    "Desserts": ["A sweet treat", "The perfect ending", "Indulgently delicious"],
  };

  const categoryDescs = descriptors[category] || descriptors["Main Course"]!;
  const desc = categoryDescs[Math.floor(Math.random() * categoryDescs.length)];
  return `${desc} — ${itemName}`;
}
