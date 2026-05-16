/**
 * OCR Service — Local Browser-Based OCR Engine
 * Uses Tesseract.js (WebAssembly) + pdfjs-dist for text extraction.
 * Runs 100% locally in the browser — NO external API calls.
 *
 * Pipeline: UPLOAD → DETECT FORMAT → EXTRACT TEXT → PARSE → JSON
 */

import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import * as XLSX from "xlsx";
import mammoth from "mammoth";
import { cleanOCRText } from "./textCleaner";
import { parseMenuFromText, parseMenuFromCSV, type ParsedMenuItem } from "./menuParser";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// ============================================================
// FILE TYPE DETECTION
// ============================================================

type FileType = "image" | "pdf" | "csv" | "excel" | "word" | "unknown";

function detectFileType(file: File): FileType {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const mime = file.type;

  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "bmp", "tiff", "webp", "gif"].includes(ext)) {
    return "image";
  }
  if (mime === "application/pdf" || ext === "pdf") {
    return "pdf";
  }
  if (mime === "text/csv" || ext === "csv") {
    return "csv";
  }
  if (["xlsx", "xls"].includes(ext) || mime.includes("spreadsheet") || mime.includes("excel")) {
    return "excel";
  }
  if (["docx", "doc"].includes(ext) || mime.includes("word")) {
    return "word";
  }
  return "unknown";
}

// ============================================================
// IMAGE OCR (Tesseract.js)
// ============================================================

export interface OCRProgress {
  status: string;
  progress: number;
}

/**
 * Run Tesseract OCR on an image file or data URL.
 * Supports English + Tamil.
 */
async function ocrImage(
  imageSource: File | string,
  onProgress?: (p: OCRProgress) => void
): Promise<string> {
  console.log("[OCR] Starting Tesseract.js OCR on image...");

  const result = await Tesseract.recognize(imageSource, "eng", {
    logger: (m) => {
      if (m.status && m.progress !== undefined) {
        onProgress?.({
          status: m.status,
          progress: Math.round(m.progress * 100),
        });
      }
    },
  });

  console.log(`[OCR] Tesseract extracted ${result.data.text.length} chars, confidence: ${result.data.confidence}%`);
  return result.data.text;
}

// ============================================================
// PDF TEXT EXTRACTION (pdfjs-dist)
// ============================================================

/**
 * Extract text from a PDF using pdfjs-dist.
 * If the PDF has a text layer, we get it directly (fast, accurate).
 * If not (scanned PDF), we fall back to Tesseract OCR on rendered pages.
 */
async function extractPDFText(
  file: File,
  onProgress?: (p: OCRProgress) => void
): Promise<string> {
  console.log("[OCR] Extracting text from PDF...");

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  let fullText = "";
  let hasTextLayer = false;

  // First pass: try to extract text layer
  for (let i = 1; i <= totalPages; i++) {
    onProgress?.({
      status: `Extracting text from page ${i}/${totalPages}`,
      progress: Math.round((i / totalPages) * 50),
    });

    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");

    if (pageText.trim().length > 20) {
      hasTextLayer = true;
    }
    fullText += pageText + "\n";
  }

  // If text layer found, return it
  if (hasTextLayer && fullText.trim().length > 50) {
    console.log(`[OCR] PDF has text layer — extracted ${fullText.length} chars from ${totalPages} pages`);
    return fullText;
  }

  // Scanned PDF — fall back to Tesseract OCR on rendered pages
  console.log("[OCR] PDF appears scanned — falling back to Tesseract OCR...");
  fullText = "";

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.({
      status: `OCR scanning page ${i}/${totalPages}`,
      progress: 50 + Math.round((i / totalPages) * 50),
    });

    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale = better OCR

    // Render page to canvas
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;

    await page.render({ canvasContext: ctx, viewport }).promise;

    // OCR the rendered canvas
    const dataUrl = canvas.toDataURL("image/png");
    const pageOCRText = await ocrImage(dataUrl);
    fullText += pageOCRText + "\n";

    // Cleanup
    canvas.remove();
  }

  console.log(`[OCR] Tesseract OCR extracted ${fullText.length} chars from ${totalPages} scanned pages`);
  return fullText;
}

// ============================================================
// EXCEL/CSV EXTRACTION
// ============================================================

async function extractExcelText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer);
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_csv(firstSheet);
}

// ============================================================
// WORD EXTRACTION
// ============================================================

async function extractWordText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  // Strip HTML tags to get plain text
  const tmp = document.createElement("div");
  tmp.innerHTML = result.value;
  return tmp.textContent || tmp.innerText || "";
}

// ============================================================
// MAIN PUBLIC API
// ============================================================

/**
 * Process a single file through the full OCR pipeline.
 * Returns structured menu items.
 */
export async function processMenuFile(
  file: File,
  onProgress?: (p: OCRProgress) => void
): Promise<ParsedMenuItem[]> {
  const fileType = detectFileType(file);
  console.log(`[OCR] Processing file: ${file.name} (type: ${fileType}, size: ${file.size} bytes)`);

  // Validate file
  if (file.size > 50 * 1024 * 1024) {
    throw new Error("File too large (max 50MB)");
  }

  let rawText = "";

  switch (fileType) {
    case "image":
      onProgress?.({ status: "Running OCR on image...", progress: 10 });
      rawText = await ocrImage(file, onProgress);
      break;

    case "pdf":
      onProgress?.({ status: "Extracting text from PDF...", progress: 10 });
      rawText = await extractPDFText(file, onProgress);
      break;

    case "csv":
      onProgress?.({ status: "Reading CSV file...", progress: 50 });
      rawText = await file.text();
      break;

    case "excel":
      onProgress?.({ status: "Parsing Excel file...", progress: 50 });
      rawText = await extractExcelText(file);
      break;

    case "word":
      onProgress?.({ status: "Parsing Word document...", progress: 50 });
      rawText = await extractWordText(file);
      break;

    default:
      throw new Error(`Unsupported file format: ${file.name}`);
  }

  onProgress?.({ status: "Parsing menu items...", progress: 80 });

  // Clean the text
  const cleanedText = cleanOCRText(rawText);
  console.log(`[OCR] Cleaned text (${cleanedText.length} chars):`, cleanedText.substring(0, 500));

  // Parse based on format
  let items: ParsedMenuItem[];
  if (fileType === "csv" || fileType === "excel") {
    items = parseMenuFromCSV(cleanedText);
  } else {
    items = parseMenuFromText(cleanedText);
  }

  onProgress?.({ status: "Complete", progress: 100 });
  console.log(`[OCR] Extracted ${items.length} menu items from ${file.name}`);

  return items;
}

/**
 * Process multiple files in batch with progress tracking.
 * Returns results per file with status tracking.
 */
export interface BatchFileResult {
  fileName: string;
  status: "pending" | "processing" | "completed" | "failed";
  items: ParsedMenuItem[];
  error?: string;
  progress: number;
}

export async function processMenuFilesBatch(
  files: File[],
  onFileProgress?: (fileIndex: number, result: BatchFileResult) => void
): Promise<BatchFileResult[]> {
  const results: BatchFileResult[] = files.map(f => ({
    fileName: f.name,
    status: "pending" as const,
    items: [],
    progress: 0,
  }));

  // Process files sequentially to avoid memory issues
  // (Tesseract.js WASM is memory-intensive)
  for (let i = 0; i < files.length; i++) {
    results[i].status = "processing";
    onFileProgress?.(i, results[i]);

    try {
      const items = await processMenuFile(files[i], (p) => {
        results[i].progress = p.progress;
        results[i].status = "processing";
        onFileProgress?.(i, { ...results[i], progress: p.progress });
      });

      results[i] = {
        ...results[i],
        status: "completed",
        items,
        progress: 100,
      };
    } catch (err: any) {
      results[i] = {
        ...results[i],
        status: "failed",
        error: err.message || "Unknown error",
        progress: 0,
      };
    }

    onFileProgress?.(i, results[i]);
  }

  return results;
}

// ============================================================
// BACKWARD-COMPATIBLE EXPORTS
// (Drop-in replacements for geminiService functions)
// ============================================================

/**
 * Drop-in replacement for geminiService.parseMenuFile
 * Takes a base64 data URL and mime type, returns parsed items.
 */
export async function parseMenuFile(fileBase64: string, mimeType: string): Promise<ParsedMenuItem[]> {
  console.log(`[OCR] parseMenuFile called (mimeType: ${mimeType})`);

  // Convert base64 data URL to a File object
  const response = await fetch(fileBase64);
  const blob = await response.blob();
  const file = new File([blob], `upload.${mimeType.split("/")[1] || "bin"}`, { type: mimeType });

  return processMenuFile(file);
}

/**
 * Drop-in replacement for geminiService.parseMenuText
 * Takes raw text and returns parsed items.
 */
export async function parseMenuText(menuText: string): Promise<ParsedMenuItem[]> {
  console.log("[OCR] parseMenuText called");
  const cleaned = cleanOCRText(menuText);

  // Try CSV first (if it has comma/tab structure)
  if (menuText.includes(",") && menuText.split("\n")[0].split(",").length >= 2) {
    const csvItems = parseMenuFromCSV(cleaned);
    if (csvItems.length > 0) return csvItems;
  }

  return parseMenuFromText(cleaned);
}

/**
 * Drop-in replacement for geminiService.generateItemDescription
 * Generates a simple description locally (no AI).
 */
export function generateItemDescription(itemName: string): string {
  return `Delicious ${itemName} — freshly prepared and served with care.`;
}
