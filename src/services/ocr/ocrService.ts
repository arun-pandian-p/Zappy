import * as pdfjs from "pdfjs-dist";
import Tesseract from "tesseract.js";
import mammoth from "mammoth";

// ─── FIX 1: pdfjs worker (v5 breaks if workerSrc is not set) ──────────────────
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ParsedMenuItem {
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
  is_veg: boolean;
}

export interface OCRProgress {
  stage: "reading" | "extracting" | "parsing" | "done" | "error";
  percent: number;
  message: string;
  pagesCurrent?: number;
  pagesTotal?: number;
}

export type ProgressCallback = (progress: OCRProgress) => void;

// ─── Main entry point ─────────────────────────────────────────────────────────
export async function extractMenuFromFile(
  file: File,
  onProgress?: ProgressCallback
): Promise<ParsedMenuItem[]> {
  const report = (p: OCRProgress) => onProgress?.(p);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  report({ stage: "reading", percent: 5, message: `Reading ${file.name}…` });

  let rawText = "";

  try {
    if (ext === "pdf") {
      rawText = await extractFromPDF(file, report);
    } else if (["jpg", "jpeg", "png", "webp", "bmp", "tiff"].includes(ext)) {
      rawText = await extractFromImage(file, report);
    } else if (["docx", "doc"].includes(ext)) {
      rawText = await extractFromDOCX(file, report);
    } else if (ext === "txt" || ext === "csv") {
      rawText = await file.text();
      report({ stage: "extracting", percent: 60, message: "Text file read." });
    } else {
      throw new Error(`Unsupported file type: .${ext}. Use PDF, JPG, PNG, DOCX, or TXT.`);
    }
  } catch (err: any) {
    report({ stage: "error", percent: 0, message: err.message });
    throw err;
  }

  report({ stage: "parsing", percent: 80, message: "Parsing menu items…" });
  const items = parseMenuText(rawText);

  report({
    stage: "done",
    percent: 100,
    message: `Done! Found ${items.length} menu items.`,
  });

  return items;
}

// ─── PDF extractor ────────────────────────────────────────────────────────────
async function extractFromPDF(
  file: File,
  report: ProgressCallback
): Promise<string> {
  // FIX 2: Load via ArrayBuffer to avoid CORS issues
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  let fullText = "";

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    report({
      stage: "extracting",
      percent: Math.round(10 + (pageNum / totalPages) * 55),
      message: `Extracting text from page ${pageNum} of ${totalPages}…`,
      pagesCurrent: pageNum,
      pagesTotal: totalPages,
    });

    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // FIX 3: Preserve line structure using y-position grouping
    const items = textContent.items as any[];
    const lines = groupIntoLines(items);
    fullText += lines.join("\n") + "\n\n";
  }

  // FIX 4: If PDF has no selectable text (scanned PDF), fall back to image OCR
  if (fullText.trim().length < 50) {
    report({
      stage: "extracting",
      percent: 40,
      message: "No text layer found — running OCR on scanned PDF…",
    });
    fullText = await extractFromScannedPDF(file, report);
  }

  return fullText;
}

// Groups PDF text items into lines by y-coordinate proximity
function groupIntoLines(items: any[]): string[] {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => {
    const dy = b.transform[5] - a.transform[5];
    return Math.abs(dy) > 3 ? dy : a.transform[4] - b.transform[4];
  });

  const lines: string[] = [];
  let currentLine = "";
  let lastY = sorted[0]?.transform[5] ?? 0;

  for (const item of sorted) {
    const y = item.transform[5];
    if (Math.abs(y - lastY) > 5) {
      if (currentLine.trim()) lines.push(currentLine.trim());
      currentLine = item.str;
    } else {
      currentLine += (currentLine && item.str ? " " : "") + item.str;
    }
    lastY = y;
  }
  if (currentLine.trim()) lines.push(currentLine.trim());
  return lines;
}

// OCR fallback for scanned PDFs — renders each page to canvas then runs Tesseract
async function extractFromScannedPDF(
  file: File,
  report: ProgressCallback
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  let fullText = "";

  // FIX 5: Create Tesseract worker ONCE and reuse (v7 API)
  const worker = await Tesseract.createWorker("eng", 1, {
    logger: () => {}, // silence internal logs
  });

  try {
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      report({
        stage: "extracting",
        percent: Math.round(30 + (pageNum / totalPages) * 40),
        message: `OCR scanning page ${pageNum} of ${totalPages}…`,
        pagesCurrent: pageNum,
        pagesTotal: totalPages,
      });

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // 2x scale = better OCR
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;

      await page.render({ canvasContext: ctx, viewport }).promise;

      const { data } = await worker.recognize(canvas);
      fullText += data.text + "\n\n";

      canvas.remove();
    }
  } finally {
    await worker.terminate();
  }

  return fullText;
}

// ─── Image OCR ────────────────────────────────────────────────────────────────
async function extractFromImage(
  file: File,
  report: ProgressCallback
): Promise<string> {
  report({ stage: "extracting", percent: 15, message: "Starting OCR on image…" });

  // FIX 6: tesseract.js v7 — createWorker API changed
  const worker = await Tesseract.createWorker("eng", 1, {
    logger: (m: any) => {
      if (m.status === "recognizing text") {
        report({
          stage: "extracting",
          percent: Math.round(15 + m.progress * 55),
          message: `OCR: ${Math.round(m.progress * 100)}% complete…`,
        });
      }
    },
  });

  try {
    const { data } = await worker.recognize(file);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

// ─── DOCX extractor ───────────────────────────────────────────────────────────
async function extractFromDOCX(
  file: File,
  report: ProgressCallback
): Promise<string> {
  report({ stage: "extracting", percent: 20, message: "Reading Word document…" });
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  report({ stage: "extracting", percent: 70, message: "Document text extracted." });
  return result.value;
}

// ─── Menu text parser ─────────────────────────────────────────────────────────
/**
 * FIX 7: Completely rewritten parser
 * Handles South Indian menu formats:
 *   - "Masala Dosa ........... ₹60"
 *   - "2. Idli Rs.30"
 *   - "Chicken Biryani - 180/-"
 *   - "STARTERS" / "-- VEG --" category headers
 *   - Prices with commas: "1,200" = 1200
 */
function parseMenuText(text: string): ParsedMenuItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  const items: ParsedMenuItem[] = [];
  let currentCategory = "Uncategorized";

  // Price patterns — covers ₹, Rs., INR, /-  with optional commas
  const priceRegex =
    /(?:₹|Rs\.?\s*|INR\s*|@\s*)[\s]*([\d,]+(?:\.\d{1,2})?)|(\d[\d,]+(?:\.\d{1,2})?)\s*(?:\/\-|INR|Rs)?$/i;

  // Category header heuristics
  const categoryRegex =
    /^[-=*#\s]*([A-Z][A-Z\s&\/()]{2,40})[-=*#\s]*$|^(STARTERS?|MAINS?|BREADS?|BIRYANI|RICE|DESSERTS?|BEVERAGES?|DRINKS?|SOUPS?|SALADS?|SNACKS?|BREAKFAST|LUNCH|DINNER|COMBOS?|SPECIALS?|VEG|NON.?VEG|SEAFOOD|CHICKEN|MUTTON|PANEER|NOODLES?|PIZZA|BURGER|CHINESE|SOUTH INDIAN|NORTH INDIAN)S?\b/i;

  // Skip lines that are clearly not menu items
  const skipRegex =
    /^(page\s*\d|gst|fssai|address|phone|website|www\.|http|tax|total|subtotal|thank|welcome|enjoy|please|note:|timings?:|hours?:)/i;

  for (const line of lines) {
    if (skipRegex.test(line)) continue;

    // Detect category headers (no price, all-caps or known keyword)
    if (categoryRegex.test(line) && !priceRegex.test(line)) {
      const match = line.match(categoryRegex);
      const candidate = (match?.[1] ?? match?.[2] ?? line)
        .replace(/[-=*#]/g, "")
        .trim();
      if (candidate.length >= 3) {
        currentCategory = toTitleCase(candidate);
        continue;
      }
    }

    // Try to extract price
    const priceMatch = line.match(priceRegex);
    if (!priceMatch) continue;

    const rawPrice = (priceMatch[1] ?? priceMatch[2]).replace(/,/g, "");
    const price = parseFloat(rawPrice);
    if (isNaN(price) || price <= 0 || price > 99999) continue;

    // Remove the price portion and leading numbering to get the name
    let name = line
      .replace(priceRegex, "")
      .replace(/^[\d]+[.):\-\s]+/, "") // remove "1." "2)" "3-"
      .replace(/\.{2,}/g, "") // remove "......"
      .replace(/[-–—|]{2,}/g, "") // remove "----"
      .replace(/\s+/g, " ")
      .trim();

    if (name.length < 2 || name.length > 120) continue;

    // Veg detection heuristics
    const isVeg = detectVeg(name);

    items.push({
      name: toTitleCase(name),
      description: "",
      price,
      category: currentCategory,
      is_available: true,
      is_veg: isVeg,
    });
  }

  return deduplicateItems(items);
}

function detectVeg(name: string): boolean {
  const nonVegKeywords =
    /\b(chicken|mutton|fish|prawn|shrimp|crab|egg|beef|pork|lamb|keema|mince|meat|seafood|biryani\s*\(non|boneless|tikka\s*chicken)\b/i;
  const vegKeywords =
    /\b(paneer|veg|tofu|soya|dal|dhal|lentil|mushroom|corn|potato|aloo|gobi|palak|rajma|chole|chana)\b/i;
  if (nonVegKeywords.test(name)) return false;
  if (vegKeywords.test(name)) return true;
  return true; // default veg
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function deduplicateItems(items: ParsedMenuItem[]): ParsedMenuItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.name.toLowerCase()}|${item.price}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
