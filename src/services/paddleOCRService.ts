/**
 * PaddleOCR Service — Hugging Face PaddleOCR-VL-1.6 Space Integration
 * Space: Arrown/paddle-ocr-space
 * Endpoint: /predict
 *
 * Provides real-time inference via Gradio API client with:
 * - Direct Gradio client streaming & status monitoring
 * - Configurable tasks (default: "Full OCR (Layout & Text)")
 * - Configurable output formats (default: "JSON", supports Markdown, Plain Text, CSV)
 * - Automatic CORS-resilient fallback to server-side proxy
 * - Layout-aware parsing, price association validation & review flagging
 */

import { Client } from "@gradio/client";
import { cleanOCRText, extractPrice, fixOCRTypos, isValidItemName, titleCase } from "./textCleaner";
import { parseMenuFromCSV, parseMenuFromText, detectCategory, isCategoryHeader, type ParsedMenuItem } from "./menuParser";
import { supabase } from "@/integrations/supabase/client";
import { tracer } from "./telemetry";
import { SpanStatusCode } from "@opentelemetry/api";

export type PaddleOCRTask =
  | "Full OCR (Layout & Text)"
  | "Table Recognition"
  | "Formula Recognition"
  | "Chart Recognition"
  | "Text Spotting"
  | "Seal Recognition";

export type PaddleOCRFormat = "JSON" | "Markdown" | "CSV" | "Plain Text";

export interface PaddleOCROptions {
  task?: PaddleOCRTask;
  format?: PaddleOCRFormat;
  timeoutMs?: number;
  signal?: AbortSignal;
  spaceUrl?: string;
  hfToken?: string;
  useProxy?: boolean;
  restaurantId?: string;
  onProgress?: (p: { status: string; progress: number }) => void;
}

export interface PaddleOCRRawResponse {
  rawOutput: string;
  task: PaddleOCRTask;
  format: PaddleOCRFormat;
  durationMs: number;
}

const DEFAULT_SPACE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_HF_PADDLE_OCR_SPACE_URL) ||
  "https://arrown-paddle-ocr-space.hf.space";

const DEFAULT_TIMEOUT_MS =
  Number(typeof import.meta !== "undefined" && import.meta.env?.VITE_HF_REQUEST_TIMEOUT_MS) || 120_000;

/**
 * Health-check helper: verifies whether the Hugging Face PaddleOCR Space is currently available.
 */
export async function checkPaddleOCRHealth(
  targetUrl: string = DEFAULT_SPACE_URL
): Promise<{ available: boolean; latencyMs?: number; error?: string }> {
  const startTime = Date.now();
  try {
    // If targetUrl is a direct HTTP/HTTPS host, test its config / info endpoint
    if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
      const url = targetUrl.replace(/\/+$/, "");
      const res = await fetch(`${url}/config`, { method: "GET", mode: "cors" });
      if (res.ok || res.status === 405 || res.status === 200) {
        return { available: true, latencyMs: Date.now() - startTime };
      }
      return { available: false, error: `Space returned HTTP ${res.status}` };
    }

    // Otherwise connect via Client.connect
    const client = await Client.connect(targetUrl);
    return { available: !!client, latencyMs: Date.now() - startTime };
  } catch (err: any) {
    return {
      available: false,
      error: err?.message || "Failed to reach PaddleOCR space",
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Strips code fences (e.g. ```json ... ``` or ```markdown ... ```) and extracts raw payload.
 */
export function extractPayloadFromCodeBlock(text: string): { cleanText: string; detectedType?: string } {
  const trimmed = (text || "").trim();

  // Check for HTML error or stopped card returned by space
  if (trimmed.includes("ocr-stopped-card ocr-error") || trimmed.includes("Extraction Stopped Due to Error")) {
    const errorMatch = trimmed.match(/<p>(.*?)<\/p>/s);
    const msg = errorMatch ? errorMatch[1].replace(/<[^>]+>/g, "").trim() : "PaddleOCR space inference error";
    throw new Error(`PaddleOCR API Error: ${msg}`);
  }

  // Check for idle / no image card
  if (trimmed.includes("ocr-stopped-card")) {
    throw new Error("PaddleOCR returned no prediction (empty or invalid image input)");
  }

  // Fenced block: ```[type]?\n...\n```
  const fenceRegex = /^```([a-zA-Z0-9_-]*)\s*\n([\s\S]*?)\n```$/;
  const match = trimmed.match(fenceRegex);
  if (match) {
    return {
      detectedType: match[1].toLowerCase(),
      cleanText: match[2].trim(),
    };
  }

  return { cleanText: trimmed };
}

/**
 * Invoke Hugging Face PaddleOCR-VL-1.6 Space using the official Gradio API contract.
 */
export async function callPaddleOCR(
  imageSource: Blob | File,
  options: PaddleOCROptions = {}
): Promise<PaddleOCRRawResponse> {
  return tracer.startActiveSpan("callPaddleOCR", async (span) => {
    const task: PaddleOCRTask = options.task || "Full OCR (Layout & Text)";
    const format: PaddleOCRFormat = options.format || "JSON";
    const spaceUrl = options.spaceUrl || DEFAULT_SPACE_URL;
    const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
    const onProgress = options.onProgress;

    span.setAttribute("paddle.task", task);
    span.setAttribute("paddle.format", format);
    span.setAttribute("paddle.space_url", spaceUrl);
    span.setAttribute("image.size", imageSource.size);
    span.setAttribute("image.type", imageSource.type);

    const startTime = Date.now();

    onProgress?.({ status: "Connecting to PaddleOCR-VL-1.6 engine...", progress: 10 });

    // If explicit proxy requested, route via Supabase Edge Function
    if (options.useProxy) {
      return callPaddleOCRViaProxy(imageSource, options, span);
    }

    // Direct Gradio Client Invocation with Timeout & Progress
    let timeoutId: any;
    let clientJob: any = null;

    try {
      const clientPromise = (async () => {
        const clientOptions: any = {};
        if (options.hfToken) {
          clientOptions.hf_token = options.hfToken;
        }

        const client = await Client.connect(spaceUrl, clientOptions);
        if (options.signal?.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }

        onProgress?.({ status: "Uploading image to PaddleOCR space...", progress: 30 });

        // Use client.submit to get live generator progress
        clientJob = client.submit("/predict", {
          image: imageSource,
          task,
          format_choice: format,
        });

        if (options.signal) {
          options.signal.addEventListener(
            "abort",
            () => {
              try {
                clientJob?.cancel?.();
              } catch (_) {}
            },
            { once: true }
          );
        }

        let finalResultText = "";

        // Iterate over generator yields
        for await (const event of clientJob) {
          if (options.signal?.aborted) {
            try {
              clientJob?.cancel?.();
            } catch (_) {}
            throw new DOMException("Aborted", "AbortError");
          }

          if (event.type === "status") {
            const stage = (event as any).stage;
            if (stage === "pending") {
              onProgress?.({ status: "Queued in PaddleOCR processing queue...", progress: 40 });
            } else if (stage === "generating") {
              onProgress?.({ status: "PaddleOCR-VL-1.6 running inference...", progress: 70 });
            }
          } else if (event.type === "data") {
            const raw = Array.isArray(event.data) ? event.data[0] : event.data;
            if (typeof raw === "string") {
              // Ignore initial HTML loading card yield
              if (raw.includes("ocr-loading-card")) {
                onProgress?.({ status: "Extracting layout and text segments...", progress: 60 });
              } else {
                finalResultText = raw;
                onProgress?.({ status: "Finalizing structured OCR output...", progress: 90 });
              }
            }
          }
        }

        if (!finalResultText) {
          throw new Error("PaddleOCR returned an empty response");
        }

        return finalResultText;
      })();

      const timeoutPromise = new Promise<never>((_, reject) => {
        if (options.signal?.aborted) {
          reject(new DOMException("OCR processing cancelled by user", "AbortError"));
          return;
        }

        const onAbort = () => {
          clearTimeout(timeoutId);
          try {
            clientJob?.cancel?.();
          } catch (_) {}
          reject(new DOMException("OCR processing cancelled by user", "AbortError"));
        };

        if (options.signal) {
          options.signal.addEventListener("abort", onAbort, { once: true });
        }

        timeoutId = setTimeout(() => {
          try {
            clientJob?.cancel?.();
          } catch (_) {}
          if (options.signal) {
            options.signal.removeEventListener("abort", onAbort);
          }
          reject(new Error(`PaddleOCR request timed out after ${Math.round(timeoutMs / 1000)}s`));
        }, timeoutMs);
      });

      const rawOutput = await Promise.race([clientPromise, timeoutPromise]);
      const durationMs = Date.now() - startTime;

      span.setAttribute("paddle.duration_ms", durationMs);
      span.setAttribute("paddle.output_length", rawOutput.length);
      span.setStatus({ code: SpanStatusCode.OK });

      return {
        rawOutput,
        task,
        format,
        durationMs,
      };
    } catch (err: any) {
      // Check if CORS or network error occurred; automatically try server proxy fallback
      const isAbort = err?.name === "AbortError" || options.signal?.aborted;
      const isNetworkOrCors =
        !isAbort &&
        (err?.message?.includes("Failed to fetch") ||
          err?.message?.includes("CORS") ||
          err?.message?.includes("NetworkError") ||
          err?.message?.includes("Load failed"));

      if (isNetworkOrCors) {
        console.warn("[PaddleOCR] Direct client failed due to network/CORS, falling back to server proxy...", err);
        onProgress?.({ status: "Switching to server proxy for PaddleOCR...", progress: 25 });
        return callPaddleOCRViaProxy(imageSource, options, span);
      }

      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR, message: err?.message });
      throw err;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      span.end();
    }
  });
}

/**
 * Server-side proxy invocation via Supabase Edge Function `ocr-menu`.
 * Keeps credentials, rate limits, and CORS handling secure.
 */
async function callPaddleOCRViaProxy(
  imageSource: Blob | File,
  options: PaddleOCROptions,
  parentSpan: any
): Promise<PaddleOCRRawResponse> {
  const startTime = Date.now();
  options.onProgress?.({ status: "Invoking secure backend PaddleOCR proxy...", progress: 35 });

  const formData = new FormData();
  formData.append("file", imageSource, (imageSource as File).name || "menu-image.jpg");
  formData.append("task", options.task || "Full OCR (Layout & Text)");
  formData.append("format", options.format || "JSON");
  if (options.restaurantId) {
    formData.append("restaurant_id", options.restaurantId);
  }

  const { data, error } = await supabase.functions.invoke("ocr-menu", {
    body: formData,
  });

  if (error) {
    parentSpan.recordException(error);
    parentSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    throw new Error(`Server OCR Proxy Error: ${error.message || "Failed to process OCR on server"}`);
  }

  if (!data || !data.success || !data.text) {
    const errorMsg = data?.error || "Invalid response from server OCR proxy";
    throw new Error(errorMsg);
  }

  options.onProgress?.({ status: "OCR extraction received from server", progress: 90 });

  return {
    rawOutput: data.text,
    task: (data.task as PaddleOCRTask) || options.task || "Full OCR (Layout & Text)",
    format: (data.format as PaddleOCRFormat) || options.format || "JSON",
    durationMs: Date.now() - startTime,
  };
}

// ============================================================
// RESPONSE PARSING & NORMALIZATION
// ============================================================

export interface PaddleParsedResult {
  items: ParsedMenuItem[];
  rawText: string;
  task: PaddleOCRTask;
  format: PaddleOCRFormat;
  warnings: string[];
}

/**
 * Parses PaddleOCR's extracted string into structured `ParsedMenuItem[]` items.
 * Adheres strictly to the requirement:
 * - Does not fabricate prices, descriptions, or dietary attributes.
 * - Missing prices remain 0 with `needsReview: true`.
 * - Ambiguous price associations are flagged for review rather than blindly matched by list index.
 */
export function parsePaddleOCRResponse(
  rawText: string,
  format: PaddleOCRFormat = "JSON",
  task: PaddleOCRTask = "Full OCR (Layout & Text)"
): PaddleParsedResult {
  const warnings: string[] = [];
  const { cleanText } = extractPayloadFromCodeBlock(rawText);

  if (!cleanText || cleanText === "*No text detected in the image.*") {
    return { items: [], rawText: cleanText, task, format, warnings: ["No text detected in document"] };
  }

  // 1. JSON Format
  if (format === "JSON") {
    try {
      const parsedJson = JSON.parse(cleanText);

      // A. Table data format: [ [col1, col2, ...], ... ]
      if (Array.isArray(parsedJson.table_data) && parsedJson.table_data.length > 0) {
        const items = parseTableData(parsedJson.table_data, warnings);
        return { items, rawText: cleanText, task, format, warnings };
      }

      // B. Lines array format: [ "Item 1 120", "Item 2 150", ... ]
      if (Array.isArray(parsedJson.lines) && parsedJson.lines.length > 0) {
        const items = parseLinesArray(parsedJson.lines, warnings);
        return { items, rawText: cleanText, task, format, warnings };
      }

      // C. Fallback to raw_output field if present
      if (typeof parsedJson.raw_output === "string" && parsedJson.raw_output.trim().length > 0) {
        const cleaned = cleanOCRText(parsedJson.raw_output);
        const items = parseMenuFromText(cleaned);
        return { items, rawText: cleaned, task, format, warnings };
      }
    } catch (jsonErr: any) {
      warnings.push(`JSON parse error: ${jsonErr.message}. Falling back to text layout parsing.`);
    }
  }

  // 2. CSV Format
  if (format === "CSV") {
    const items = parseMenuFromCSV(cleanText);
    return { items, rawText: cleanText, task, format, warnings };
  }

  // 3. Markdown Format (Check if contains Markdown tables)
  if (format === "Markdown" && cleanText.includes("|") && cleanText.includes("---")) {
    const tableItems = parseMarkdownTable(cleanText, warnings);
    if (tableItems.length > 0) {
      return { items: tableItems, rawText: cleanText, task, format, warnings };
    }
  }

  // 4. Plain Text or General Text Parsing
  const cleaned = cleanOCRText(cleanText);
  const items = parseMenuFromText(cleaned);

  return { items, rawText: cleaned, task, format, warnings };
}

/**
 * Parses 2D table grid cells extracted by PaddleOCR.
 */
function parseTableData(rows: string[][], warnings: string[]): ParsedMenuItem[] {
  if (rows.length === 0) return [];

  // Identify column indices from header row (if row 0 is a header)
  let nameCol = 0;
  let priceCol = -1;
  let catCol = -1;
  let descCol = -1;
  let startIndex = 0;

  const headerRow = rows[0].map((c) => (c || "").trim().toLowerCase());
  const hasHeader = headerRow.some((h) =>
    ["item", "name", "dish", "price", "rate", "cost", "category", "description"].some((kw) => h.includes(kw))
  );

  if (hasHeader) {
    startIndex = 1;
    for (let c = 0; c < headerRow.length; c++) {
      const col = headerRow[c];
      if (col.includes("name") || col.includes("item") || col.includes("dish")) nameCol = c;
      else if (col.includes("price") || col.includes("rate") || col.includes("cost") || col.includes("amount") || col.includes("₹")) priceCol = c;
      else if (col.includes("cat")) catCol = c;
      else if (col.includes("desc")) descCol = c;
    }
  }

  // If priceCol not found from header, find first numeric column
  if (priceCol === -1) {
    for (let c = 0; c < rows[0].length; c++) {
      if (c === nameCol) continue;
      const numericCount = rows.slice(startIndex, startIndex + 5).filter((r) => {
        const val = r[c]?.replace(/[^0-9.]/g, "");
        return val && !isNaN(Number(val)) && Number(val) > 0;
      }).length;
      if (numericCount >= 2) {
        priceCol = c;
        break;
      }
    }
  }

  const items: ParsedMenuItem[] = [];

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rawName = row[nameCol] || "";
    const cleanName = fixOCRTypos(rawName.trim());
    if (!cleanName || !isValidItemName(cleanName)) continue;

    let price = 0;
    let needsReview = false;
    let reviewReason: string | undefined;
    let rawPrice: string | undefined;

    if (priceCol >= 0 && row[priceCol]) {
      rawPrice = row[priceCol].trim();
      const extracted = extractPrice(rawPrice);
      if (extracted !== null && extracted > 0) {
        price = extracted;
      } else {
        needsReview = true;
        reviewReason = `Invalid price in table cell: "${rawPrice}"`;
      }
    } else {
      needsReview = true;
      reviewReason = "Missing price in table row";
    }

    const category = catCol >= 0 && row[catCol] ? titleCase(row[catCol].trim()) : "Main Course";
    const description = descCol >= 0 && row[descCol] ? row[descCol].trim() : "";

    const dietary = inspectDietaryTags(cleanName, description);

    items.push({
      name: titleCase(cleanName),
      price,
      category,
      description,
      confidence: needsReview ? 65 : 92,
      needsReview,
      reviewReason,
      rawPrice,
      isVegetarian: dietary.isVegetarian,
      isVegan: dietary.isVegan,
      isJain: dietary.isJain,
      isGlutenFree: dietary.isGlutenFree,
    });
  }

  return items;
}

/**
 * Parses lines array with layout protection against naive list-index pairing,
 * supporting sequential, inline, multi-line interleaved [serial, name, price] and [name, price] patterns.
 */
function parseLinesArray(lines: string[], warnings: string[]): ParsedMenuItem[] {
  const cleanLines = lines.map(l => l.trim()).filter(Boolean);

  // Check 1: Layout analysis for separated disjoint columns (all names in a block, then all prices in a block)
  // e.g. [ "Garlic Naan", "Tandoori Roti", ... ], followed by [ "80", "40", ... ]
  const itemCandidates: { text: string; index: number }[] = [];
  const priceCandidates: { price: number; raw: string; index: number }[] = [];

  for (let idx = 0; idx < cleanLines.length; idx++) {
    const line = cleanLines[idx];
    if (isCategoryHeader(line)) continue;

    const standalonePrice = line.match(/^(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d{1,2})?)\s*(?:\/-)?$/i);
    if (standalonePrice) {
      const p = parseFloat(standalonePrice[1]);
      // Exclude small serial numbers (like 1, 2, 3, 4) from being treated as standalone prices
      const hasCurrency = /(?:₹|rs\.?|inr)/i.test(line);
      if (hasCurrency || p >= 10 || (p > 0 && !/^\d{1,2}$/.test(line))) {
        priceCandidates.push({ price: p, raw: line, index: idx });
        continue;
      }
    }

    if (isValidItemName(line) && !/^\d+$/.test(line)) {
      itemCandidates.push({ text: line, index: idx });
    }
  }

  // If item candidates and standalone prices are completely separated into disjoint blocks:
  if (
    priceCandidates.length > 2 &&
    itemCandidates.length > 2 &&
    priceCandidates[0].index > itemCandidates[itemCandidates.length - 1].index
  ) {
    warnings.push("Detected separated item names and price columns without explicit alignment. Flagged for review.");
    return itemCandidates.map((cand, idx) => {
      const associatedPrice = priceCandidates[idx];
      const dietary = inspectDietaryTags(cand.text);
      return {
        name: titleCase(fixOCRTypos(cand.text)),
        price: 0, // Flagged for review rather than blind assignment
        category: detectCategory(cand.text, "Main Course"),
        description: "",
        confidence: 50,
        needsReview: true,
        reviewReason: associatedPrice
          ? `Ambiguous price association: separated lists (candidate ₹${associatedPrice.price})`
          : "Missing price association",
        rawPrice: associatedPrice?.raw,
        isVegetarian: dietary.isVegetarian,
        isVegan: dietary.isVegan,
        isJain: dietary.isJain,
        isGlutenFree: dietary.isGlutenFree,
      };
    });
  }

  // Check 2: Sequential & interleaved extraction
  // Many OCR outputs have:
  // - Category headers on their own line ("TIFFIN", "SOUTH INDIAN", "MAIN COURSE")
  // - Inline items: "Masala Dosa 70"
  // - Multi-line interleaved items: [ "1.", "Masala Dosa", "70" ] or [ "Masala Dosa", "70" ]
  const extractedSequential: ParsedMenuItem[] = [];
  let currentCategory = "Main Course";

  let i = 0;
  while (i < cleanLines.length) {
    const line = cleanLines[i];

    // Check if category header
    const catHeader = isCategoryHeader(line);
    if (catHeader) {
      currentCategory = catHeader;
      i++;
      continue;
    }

    // Check if current line itself is an inline item with price
    // e.g. "Masala Dosa ₹120", "Butter Naan 60", "Paneer Tikka - 220"
    const inlinePriceMatch = line.match(/^(.+?)[\s.…_-]+(?:₹|Rs\.?\s*|INR\s*)?(\d+(?:\.\d{1,2})?)(?:\s*\/?-?\s*)?$/i);
    if (inlinePriceMatch) {
      const rawName = inlinePriceMatch[1].replace(/^\d+[\s.)-]+/, "").trim();
      const extractedVal = extractPrice(inlinePriceMatch[2]);
      if (rawName && isValidItemName(rawName) && extractedVal !== null && extractedVal > 0) {
        const dietary = inspectDietaryTags(rawName);
        extractedSequential.push({
          name: titleCase(fixOCRTypos(rawName)),
          price: extractedVal,
          category: detectCategory(rawName, currentCategory),
          description: "",
          confidence: 88,
          needsReview: false,
          rawPrice: inlinePriceMatch[2],
          isVegetarian: dietary.isVegetarian,
          isVegan: dietary.isVegan,
          isJain: dietary.isJain,
          isGlutenFree: dietary.isGlutenFree,
        });
        i++;
        continue;
      }
    }

    // Check pattern: [Serial number, Item Name, Standalone Price]
    // e.g. cleanLines[i] = "1" or "1.", cleanLines[i+1] = "Masala Dosa", cleanLines[i+2] = "70"
    const isSerial = /^\d{1,3}[.)]?$/.test(line);
    if (isSerial && i + 2 < cleanLines.length) {
      const nextLine = cleanLines[i + 1];
      const priceLine = cleanLines[i + 2];
      const parsedPrice = extractPrice(priceLine);
      const isNextLineItem = isValidItemName(nextLine) && !/^\d+$/.test(nextLine);

      if (isNextLineItem && parsedPrice !== null && parsedPrice > 0) {
        const dietary = inspectDietaryTags(nextLine);
        extractedSequential.push({
          name: titleCase(fixOCRTypos(nextLine)),
          price: parsedPrice,
          category: detectCategory(nextLine, currentCategory),
          description: "",
          confidence: 85,
          needsReview: false,
          rawPrice: priceLine,
          isVegetarian: dietary.isVegetarian,
          isVegan: dietary.isVegan,
          isJain: dietary.isJain,
          isGlutenFree: dietary.isGlutenFree,
        });
        i += 3;
        continue;
      }
    }

    // Check pattern: [Item Name, Standalone Price]
    // e.g. cleanLines[i] = "Masala Dosa", cleanLines[i+1] = "70" or "₹70"
    if (i + 1 < cleanLines.length) {
      const priceLine = cleanLines[i + 1];
      const parsedPrice = extractPrice(priceLine);
      const isCurrentItem = isValidItemName(line) && !/^\d+$/.test(line);
      const isPriceOnly = /^(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d{1,2})?)\s*(?:\/-)?$/i.test(priceLine);

      if (isCurrentItem && isPriceOnly && parsedPrice !== null && parsedPrice > 0) {
        const dietary = inspectDietaryTags(line);
        extractedSequential.push({
          name: titleCase(fixOCRTypos(line)),
          price: parsedPrice,
          category: detectCategory(line, currentCategory),
          description: "",
          confidence: 85,
          needsReview: false,
          rawPrice: priceLine,
          isVegetarian: dietary.isVegetarian,
          isVegan: dietary.isVegan,
          isJain: dietary.isJain,
          isGlutenFree: dietary.isGlutenFree,
        });
        i += 2;
        continue;
      }
    }

    i++;
  }

  // If sequential / interleaved matching found items, return them!
  if (extractedSequential.length > 0) {
    return extractedSequential;
  }

  // Fallback to full text parser
  const cleanedText = cleanOCRText(cleanLines.join("\n"));
  return parseMenuFromText(cleanedText);
}

/**
 * Parses markdown table formatted text: | Item | Price |
 */
function parseMarkdownTable(md: string, warnings: string[]): ParsedMenuItem[] {
  const lines = md.split("\n").filter((l) => l.trim().startsWith("|") && l.trim().endsWith("|"));
  const rows: string[][] = [];

  for (const line of lines) {
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

    // Skip separator row |---|---|
    if (cells.every((c) => /^[-:\s]+$/.test(c))) continue;
    if (cells.length > 0) rows.push(cells);
  }

  return parseTableData(rows, warnings);
}

/**
 * Detects dietary tags conservatively without fabricating attributes.
 */
function inspectDietaryTags(
  name: string,
  desc: string = ""
): { isVegetarian?: boolean; isVegan?: boolean; isJain?: boolean; isGlutenFree?: boolean } {
  const text = `${name} ${desc}`.toLowerCase();

  const isNonVeg =
    text.includes("chicken") ||
    text.includes("mutton") ||
    text.includes("fish") ||
    text.includes("prawn") ||
    text.includes("crab") ||
    text.includes("beef") ||
    text.includes("pork") ||
    text.includes("meat") ||
    text.includes("egg");

  const explicitVeg = text.includes("veg") || text.includes("(v)") || text.includes("paneer") || text.includes("dal");
  const isVegetarian = isNonVeg ? false : explicitVeg ? true : undefined;

  const isVegan = text.includes("vegan") ? true : undefined;
  const isJain = text.includes("jain") ? true : undefined;
  const isGlutenFree = text.includes("gluten free") || text.includes("gluten-free") || text.includes("gf") ? true : undefined;

  return { isVegetarian, isVegan, isJain, isGlutenFree };
}

// ============================================================
// HIGH-LEVEL PROCESSORS
// ============================================================

/**
 * Process a single image file with PaddleOCR-VL-1.6.
 */
export async function processImageWithPaddleOCR(
  imageFile: Blob | File,
  options: PaddleOCROptions = {}
): Promise<ParsedMenuItem[]> {
  const result = await callPaddleOCR(imageFile, {
    task: options.task || "Full OCR (Layout & Text)",
    format: options.format || "JSON",
    ...options,
  });

  const parsed = parsePaddleOCRResponse(result.rawOutput, result.format, result.task);
  return parsed.items;
}

/**
 * Process scanned PDF pages using PaddleOCR.
 * Renders each page to canvas -> image Blob -> PaddleOCR API.
 */
export async function processScannedPdfPagesWithPaddleOCR(
  pdfFile: File,
  pdfjsLib: any,
  options: PaddleOCROptions & { maxPages?: number } = {}
): Promise<ParsedMenuItem[]> {
  const maxPages = options.maxPages || 5;
  const onProgress = options.onProgress;

  onProgress?.({ status: "Loading PDF for PaddleOCR scan...", progress: 5 });

  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = Math.min(pdf.numPages, maxPages);

  const allItems: ParsedMenuItem[] = [];

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.({
      status: `PaddleOCR scanning page ${i}/${totalPages}...`,
      progress: Math.round(((i - 1) / totalPages) * 80) + 10,
    });

    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    canvas.remove();

    if (!blob) continue;

    const pageItems = await processImageWithPaddleOCR(blob, {
      ...options,
      onProgress: (p) => {
        const pagePortion = (1 / totalPages) * 70;
        const base = 10 + ((i - 1) / totalPages) * 70;
        onProgress?.({
          status: `Page ${i}/${totalPages}: ${p.status}`,
          progress: Math.round(base + (p.progress / 100) * pagePortion),
        });
      },
    });

    allItems.push(...pageItems);
  }

  onProgress?.({ status: "PaddleOCR extraction complete", progress: 100 });
  return allItems;
}
