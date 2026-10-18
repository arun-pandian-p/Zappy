import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parsePaddleOCRResponse,
  extractPayloadFromCodeBlock,
  checkPaddleOCRHealth,
  callPaddleOCR,
  type PaddleOCRFormat,
} from "./paddleOCRService";

describe("PaddleOCRService", () => {
  describe("extractPayloadFromCodeBlock", () => {
    it("extracts clean JSON payload from fenced json block", () => {
      const input = "```json\n{\n  \"task\": \"Full OCR\",\n  \"raw_output\": \"test\"\n}\n```";
      const result = extractPayloadFromCodeBlock(input);
      expect(result.detectedType).toBe("json");
      expect(result.cleanText).toBe('{\n  "task": "Full OCR",\n  "raw_output": "test"\n}');
    });

    it("extracts clean text from fenced text block", () => {
      const input = "```text\nSample OCR text line 1\nSample line 2\n```";
      const result = extractPayloadFromCodeBlock(input);
      expect(result.detectedType).toBe("text");
      expect(result.cleanText).toBe("Sample OCR text line 1\nSample line 2");
    });

    it("extracts clean CSV from fenced csv block", () => {
      const input = "```csv\nItem,Price\nIdli,50\n```";
      const result = extractPayloadFromCodeBlock(input);
      expect(result.detectedType).toBe("csv");
      expect(result.cleanText).toBe("Item,Price\nIdli,50");
    });

    it("throws clear error on Gradio HTML error card", () => {
      const htmlError = `
      <div class="ocr-stopped-card ocr-error">
        <h4>Extraction Stopped Due to Error</h4>
        <p>CUDA out of memory</p>
      </div>`;
      expect(() => extractPayloadFromCodeBlock(htmlError)).toThrow(
        /PaddleOCR API Error: CUDA out of memory/
      );
    });

    it("throws error on empty/no-image stopped card", () => {
      const htmlWarning = `
      <div class="ocr-stopped-card ocr-warning">
        <h4>No Image Uploaded / Stopped</h4>
        <p>Please upload a document image</p>
      </div>`;
      expect(() => extractPayloadFromCodeBlock(htmlWarning)).toThrow(
        /PaddleOCR returned no prediction/
      );
    });

    it("returns raw text if not fenced", () => {
      const input = "Plain line 1\nPlain line 2";
      const result = extractPayloadFromCodeBlock(input);
      expect(result.cleanText).toBe("Plain line 1\nPlain line 2");
    });
  });

  describe("parsePaddleOCRResponse - Structured JSON Output", () => {
    it("parses structured table_data with headers, prices, and categories", () => {
      const jsonResponse = JSON.stringify({
        task: "Full OCR (Layout & Text)",
        table_data: [
          ["Dish Name", "Price (INR)", "Category", "Description"],
          ["Paneer Butter Masala", "₹260", "Main Course", "Rich tomato cashew gravy"],
          ["Chicken Biryani", "320", "Main Course", "Aromatic basmati rice with chicken"],
          ["Filter Coffee", "40.00", "Drinks", "Traditional South Indian brew"],
        ],
      });

      const { items, warnings } = parsePaddleOCRResponse(jsonResponse, "JSON");

      expect(items).toHaveLength(3);
      expect(items[0].name).toBe("Paneer Butter Masala");
      expect(items[0].price).toBe(260);
      expect(items[0].category).toBe("Main Course");
      expect(items[0].description).toBe("Rich tomato cashew gravy");
      expect(items[0].isVegetarian).toBe(true);
      expect(items[0].needsReview).toBe(false);

      expect(items[1].name).toBe("Chicken Biryani");
      expect(items[1].price).toBe(320);
      expect(items[1].isVegetarian).toBe(false);

      expect(items[2].name).toBe("Filter Coffee");
      expect(items[2].price).toBe(40);
      expect(items[2].category).toBe("Drinks");
    });

    it("handles missing prices in table_data by setting price 0 and flagging for review", () => {
      const jsonResponse = JSON.stringify({
        task: "Full OCR (Layout & Text)",
        table_data: [
          ["Item", "Price", "Category"],
          ["Seasonal Chef Special", "", "Specials"],
          ["Market Price Fish", "N/A", "Seafood"],
        ],
      });

      const { items } = parsePaddleOCRResponse(jsonResponse, "JSON");

      expect(items).toHaveLength(2);
      expect(items[0].name).toBe("Seasonal Chef Special");
      expect(items[0].price).toBe(0);
      expect(items[0].needsReview).toBe(true);
      expect(items[0].reviewReason).toMatch(/missing price/i);

      expect(items[1].name).toBe("Market Price Fish");
      expect(items[1].price).toBe(0);
      expect(items[1].needsReview).toBe(true);
    });

    it("does NOT match menu prices solely by list position when items and prices are separated", () => {
      // Disjoint candidate lists: 4 dish names, then 4 price numbers below
      const jsonResponse = JSON.stringify({
        task: "Full OCR (Layout & Text)",
        lines: [
          "Garlic Naan",
          "Tandoori Roti",
          "Butter Chicken",
          "Dal Makhani",
          "80",
          "40",
          "340",
          "220",
        ],
      });

      const { items, warnings } = parsePaddleOCRResponse(jsonResponse, "JSON");

      expect(items).toHaveLength(4);
      // All items must be flagged for manual review instead of fabricating position-based pairings
      for (const item of items) {
        expect(item.needsReview).toBe(true);
        expect(item.price).toBe(0);
        expect(item.reviewReason).toMatch(/ambiguous price association/i);
      }
      expect(warnings.some((w) => w.includes("separated item names and price columns"))).toBe(true);
    });

    it("parses lines where name and price are inline", () => {
      const jsonResponse = JSON.stringify({
        task: "Full OCR (Layout & Text)",
        lines: [
          "Masala Dosa ₹120",
          "Medu Vada 2 Pcs ... 60",
          "Cold Coffee - 90",
        ],
      });

      const { items } = parsePaddleOCRResponse(jsonResponse, "JSON");

      expect(items).toHaveLength(3);
      expect(items[0].name).toBe("Masala Dosa");
      expect(items[0].price).toBe(120);
      expect(items[0].needsReview).toBeFalsy();

      expect(items[1].name).toBe("Medu Vada 2 Pcs");
      expect(items[1].price).toBe(60);

      expect(items[2].name).toBe("Cold Coffee");
      expect(items[2].price).toBe(90);
    });

    it("parses interleaved lines with serial number, item name, and price", () => {
      const jsonResponse = JSON.stringify({
        task: "Full OCR (Layout & Text)",
        lines: [
          "SOUTH INDIAN",
          "1.",
          "Masala Dosa",
          "80",
          "2.",
          "Rava Upma",
          "35",
          "3.",
          "Medu Vada",
          "40",
        ],
      });

      const { items } = parsePaddleOCRResponse(jsonResponse, "JSON");

      expect(items).toHaveLength(3);
      expect(items[0].name).toBe("Masala Dosa");
      expect(items[0].price).toBe(80);
      expect(items[0].category).toBe("South Indian");
      expect(items[0].needsReview).toBe(false);

      expect(items[1].name).toBe("Rava Upma");
      expect(items[1].price).toBe(35);

      expect(items[2].name).toBe("Medu Vada");
      expect(items[2].price).toBe(40);
    });

    it("parses interleaved lines with item name and standalone price", () => {
      const jsonResponse = JSON.stringify({
        task: "Full OCR (Layout & Text)",
        lines: [
          "Paneer Butter Masala",
          "220",
          "Garlic Naan",
          "60",
        ],
      });

      const { items } = parsePaddleOCRResponse(jsonResponse, "JSON");

      expect(items).toHaveLength(2);
      expect(items[0].name).toBe("Paneer Butter Masala");
      expect(items[0].price).toBe(220);
      expect(items[1].name).toBe("Garlic Naan");
      expect(items[1].price).toBe(60);
    });
  });

  describe("parsePaddleOCRResponse - Markdown & Plain Text Output", () => {
    it("parses Markdown table output", () => {
      const markdown = `
| Item | Price | Category |
| --- | --- | --- |
| Veg Hakka Noodles | 190 | Chinese |
| Chilli Chicken | 240 | Chinese |
`;
      const { items } = parsePaddleOCRResponse(markdown, "Markdown");

      expect(items).toHaveLength(2);
      expect(items[0].name).toBe("Veg Hakka Noodles");
      expect(items[0].price).toBe(190);
      expect(items[0].isVegetarian).toBe(true);

      expect(items[1].name).toBe("Chilli Chicken");
      expect(items[1].price).toBe(240);
      expect(items[1].isVegetarian).toBe(false);
    });

    it("parses Plain Text output", () => {
      const plainText = "```text\nSTARTERS\nPaneer Tikka ₹220\nChicken Tikka ₹280\n```";
      const { items } = parsePaddleOCRResponse(plainText, "Plain Text");

      expect(items).toHaveLength(2);
      expect(items[0].name).toBe("Paneer Tikka");
      expect(items[0].price).toBe(220);
      expect(items[1].name).toBe("Chicken Tikka");
      expect(items[1].price).toBe(280);
    });

    it("parses CSV output", () => {
      const csv = "```csv\nItem,Price,Category\nVeg Biryani,180,Rice\nEgg Curry,150,Curry\n```";
      const { items } = parsePaddleOCRResponse(csv, "CSV");

      expect(items).toHaveLength(2);
      expect(items[0].name).toBe("Veg Biryani");
      expect(items[0].price).toBe(180);
      expect(items[1].name).toBe("Egg Curry");
      expect(items[1].price).toBe(150);
    });
  });

  describe("checkPaddleOCRHealth", () => {
    it("checks availability of direct HTTP URL", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      } as any);

      const health = await checkPaddleOCRHealth("https://arrown-paddle-ocr-space.hf.space");
      expect(health.available).toBe(true);
      expect(health.latencyMs).toBeGreaterThanOrEqual(0);

      globalThis.fetch = originalFetch;
    });

    it("reports unavailable if space returns error status", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      } as any);

      const health = await checkPaddleOCRHealth("https://arrown-paddle-ocr-space.hf.space");
      expect(health.available).toBe(false);
      expect(health.error).toContain("503");

      globalThis.fetch = originalFetch;
    });
  });

  describe("callPaddleOCR error handling and timeouts", () => {
    it("enforces timeout on slow space responses", async () => {
      // Mock Client.connect to return a job that hangs indefinitely
      const fakeBlob = new Blob(["fake-image-bytes"], { type: "image/png" });

      await expect(
        callPaddleOCR(fakeBlob, {
          timeoutMs: 50, // 50ms quick timeout
          spaceUrl: "https://mock-space.hf.space",
        })
      ).rejects.toThrow(/timed out/i);
    });

    it("immediately cancels and rejects when signal is aborted (user clicks stop)", async () => {
      const fakeBlob = new Blob(["fake-image-bytes"], { type: "image/png" });
      const controller = new AbortController();

      const promise = callPaddleOCR(fakeBlob, {
        timeoutMs: 120_000,
        signal: controller.signal,
        spaceUrl: "https://mock-space.hf.space",
      });

      // User clicks Stop after 20ms
      setTimeout(() => controller.abort(), 20);

      await expect(promise).rejects.toThrow(/cancelled by user|Aborted/i);
    });
  });

  describe("Credential & Multi-tenant security", () => {
    it("never logs tokens or embeds HF token in returned response", async () => {
      const jsonResponse = JSON.stringify({
        task: "Full OCR (Layout & Text)",
        lines: ["Veg Fried Rice 160"],
      });

      const parsed = parsePaddleOCRResponse(jsonResponse, "JSON");
      const serialized = JSON.stringify(parsed);

      expect(serialized).not.toContain("hf_");
      expect(serialized).not.toContain("token");
      expect(serialized).not.toContain("secret");
    });
  });
});
