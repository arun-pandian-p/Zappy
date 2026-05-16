/**
 * 🧪 Test Local OCR Parser
 * Verifies the local CSV menu parser logic against a sample file without external API calls.
 * 
 * Usage: node scripts/ai/test_local_ocr.cjs
 */
const fs = require('fs');

function extractPrice(priceStr) {
  if (!priceStr) return null;
  let cleaned = priceStr
    .replace(/[₹$€£¥]/g, "")
    .replace(/Rs\.?/gi, "")
    .replace(/INR/gi, "")
    .replace(/[,\s]/g, "")
    .trim();
  const match = cleaned.match(/(\d+(?:\.\d{1,2})?)/);
  if (match) {
    const price = parseFloat(match[1]);
    if (price >= 1 && price <= 10000) return price;
  }
  return null;
}

function titleCase(text) {
  const lowercaseWords = new Set(["and", "or", "the", "in", "on", "with", "a", "an", "of", "for"]);
  return text.toLowerCase().split(/\s+/).map((word, index) => {
    if (index === 0 || !lowercaseWords.has(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  }).join(" ");
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else { current += char; }
  }
  result.push(current.trim());
  return result;
}

function parseMenuFromCSV(csvText) {
  const lines = csvText.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];

  const items = [];
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const nameIdx = headers.findIndex(h => ["item", "item name", "name", "dish", "food"].includes(h));
  const priceIdx = headers.findIndex(h => ["price", "cost", "amount", "rate"].includes(h));
  const catIdx = headers.findIndex(h => ["category", "cat", "type", "section"].includes(h));
  const descIdx = headers.findIndex(h => ["description", "desc", "details"].includes(h));

  console.log("Headers detected:", headers);
  console.log("Column mapping: name=" + nameIdx + " price=" + priceIdx + " cat=" + catIdx + " desc=" + descIdx);

  if (nameIdx === -1 || priceIdx === -1) {
    console.error("Could not detect 'name' or 'price' columns!");
    return [];
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (!cols || cols.length <= Math.max(nameIdx, priceIdx)) continue;

    const name = cols[nameIdx]?.trim() || "";
    const price = extractPrice(cols[priceIdx] || "");
    const rawCategory = catIdx >= 0 ? cols[catIdx]?.trim() || "" : "";
    const description = descIdx >= 0 ? cols[descIdx]?.trim() || "" : "";

    if (!name || !price) continue;

    items.push({
      name: titleCase(name),
      price,
      category: rawCategory ? titleCase(rawCategory) : "Main Course",
      description,
      confidence: 0.95,
    });
  }

  return items;
}

console.log("=".repeat(60));
console.log("TEST: Local OCR Parser — menu_import.csv");
console.log("=".repeat(60));

try {
  const csvContent = fs.readFileSync('menu_import.csv', 'utf-8');
  const items = parseMenuFromCSV(csvContent);

  console.log(`\nExtracted ${items.length} items:\n`);
  items.forEach((item, i) => {
    console.log(`  ${i + 1}. [${item.category}] ${item.name} — ₹${item.price} (confidence: ${item.confidence})`);
    if (item.description) console.log(`     "${item.description.substring(0, 60)}..."`);
  });

  console.log("\n" + "=".repeat(60));
  console.log("JSON OUTPUT (Sample):");
  console.log("=".repeat(60));
  console.log(JSON.stringify(items.slice(0, 5), null, 2));
} catch (err) {
  console.error("Error reading file:", err.message);
}
