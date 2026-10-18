import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  processMenuFile,
  processMenuFilesBatch,
  buildOCRCacheKey,
  type OCROptions,
} from "./ocrService";
import * as paddleModule from "./paddleOCRService";
import { AICacheService } from "./aiCacheService";

describe("OCRService Integration & Engine Routing", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Cache Key Isolation (Requirement 4)", () => {
    it("generates distinct cache keys for different engines on the same file hash", () => {
      const hash = "a3f5b8c9d0e1";
      const keyPaddle = buildOCRCacheKey({ fileHash: hash, engine: "paddle" });
      const keyTesseract = buildOCRCacheKey({ fileHash: hash, engine: "tesseract" });

      expect(keyPaddle).not.toEqual(keyTesseract);
      expect(keyPaddle).toContain("eng:paddle");
      expect(keyTesseract).toContain("eng:tesseract");
    });

    it("generates distinct cache keys for different tasks and formats", () => {
      const hash = "a3f5b8c9d0e1";
      const keyJson = buildOCRCacheKey({
        fileHash: hash,
        engine: "paddle",
        task: "Full OCR (Layout & Text)",
        format: "JSON",
      });
      const keyMarkdown = buildOCRCacheKey({
        fileHash: hash,
        engine: "paddle",
        task: "Full OCR (Layout & Text)",
        format: "Markdown",
      });
      const keyTable = buildOCRCacheKey({
        fileHash: hash,
        engine: "paddle",
        task: "Table Recognition",
        format: "CSV",
      });

      expect(keyJson).not.toEqual(keyMarkdown);
      expect(keyJson).not.toEqual(keyTable);
      expect(keyJson).toContain("fmt:json");
      expect(keyMarkdown).toContain("fmt:markdown");
      expect(keyTable).toContain("task:table_recognition");
    });

    it("never returns cached Tesseract results when PaddleOCR engine is requested", async () => {
      const mockFile = new File(["dummy image content"], "menu.jpg", { type: "image/jpeg" });
      const hashSpy = vi.spyOn(AICacheService, "get").mockImplementation(async (feature, key) => {
        // If caller looks up tesseract key, return cached items
        if (key.includes("eng:tesseract")) {
          return [
            {
              name: "Old Tesseract Item",
              price: 100,
              category: "Main Course",
              description: "",
              confidence: 80,
            },
          ] as any;
        }
        return null;
      });

      const paddleSpy = vi.spyOn(paddleModule, "processImageWithPaddleOCR").mockResolvedValue([
        {
          name: "Fresh PaddleOCR Item",
          price: 250,
          category: "Starters",
          description: "Extracted via PaddleOCR-VL-1.6",
          confidence: 95,
        },
      ]);

      const items = await processMenuFile(mockFile, { ocrEngine: "paddle" });

      expect(paddleSpy).toHaveBeenCalledTimes(1);
      expect(items[0].name).toBe("Fresh PaddleOCR Item");
      expect(items[0].name).not.toBe("Old Tesseract Item");
    });
  });

  describe("Engine Routing (Requirement 2)", () => {
    it("routes 'paddle' engine to processImageWithPaddleOCR for images", async () => {
      const mockFile = new File(["image-bytes"], "restaurant-menu.png", { type: "image/png" });

      const paddleSpy = vi.spyOn(paddleModule, "processImageWithPaddleOCR").mockResolvedValue([
        {
          name: "Paneer Tikka",
          price: 220,
          category: "Starters",
          description: "",
          confidence: 92,
        },
      ]);

      const items = await processMenuFile(mockFile, {
        ocrEngine: "paddle",
        paddleTask: "Full OCR (Layout & Text)",
        paddleFormat: "JSON",
      });

      expect(paddleSpy).toHaveBeenCalledTimes(1);
      expect(paddleSpy).toHaveBeenCalledWith(
        mockFile,
        expect.objectContaining({
          task: "Full OCR (Layout & Text)",
          format: "JSON",
        })
      );
      expect(items[0].name).toBe("Paneer Tikka");
    });

    it("throws clear error when 'surya' engine is requested but not configured", async () => {
      const mockFile = new File(["image-bytes"], "menu.png", { type: "image/png" });

      await expect(
        processMenuFile(mockFile, { ocrEngine: "surya" })
      ).rejects.toThrow(/Surya OCR engine is not configured/);
    });

    it("throws clear error when 'easy' engine is requested but not configured", async () => {
      const mockFile = new File(["image-bytes"], "menu.png", { type: "image/png" });

      await expect(
        processMenuFile(mockFile, { ocrEngine: "easy" })
      ).rejects.toThrow(/EasyOCR engine is not configured/);
    });
  });

  describe("Tesseract Offline Fallback", () => {
    it("falls back to local Tesseract when PaddleOCR fails and fallbackToTesseractOnError is enabled", async () => {
      const mockFile = new File(["image-bytes"], "menu.jpg", { type: "image/jpeg" });

      vi.spyOn(paddleModule, "processImageWithPaddleOCR").mockRejectedValue(
        new Error("Space Unavailable: 503 Service Unavailable")
      );

      const tesseractModule = await import("tesseract.js");
      vi.spyOn(tesseractModule.default, "recognize").mockResolvedValue({
        data: { text: "Masala Dosa 120", confidence: 90 },
      } as any);

      const progressUpdates: string[] = [];
      const items = await processMenuFile(
        mockFile,
        {
          ocrEngine: "paddle",
          fallbackToTesseractOnError: true,
        },
        (p) => progressUpdates.push(p.status)
      );

      expect(progressUpdates.some((s) => s.includes("Falling back to local Tesseract"))).toBe(true);
      expect(Array.isArray(items)).toBe(true);
      expect(items[0].name).toBe("Masala Dosa");
    });

    it("propagates error when fallbackToTesseractOnError is disabled", async () => {
      const mockFile = new File(["image-bytes"], "menu.jpg", { type: "image/jpeg" });

      vi.spyOn(paddleModule, "processImageWithPaddleOCR").mockRejectedValue(
        new Error("PaddleOCR Network Error")
      );

      await expect(
        processMenuFile(mockFile, {
          ocrEngine: "paddle",
          fallbackToTesseractOnError: false,
        })
      ).rejects.toThrow("PaddleOCR Network Error");
    });
  });

  describe("CSV & Excel File Processing Preservation", () => {
    it("preserves direct CSV parsing regardless of engine setting", async () => {
      const csvContent = "Item,Price,Category\nMasala Dosa,120,Breakfast\nIdli,50,Breakfast";
      const csvFile = new File([csvContent], "menu.csv", { type: "text/csv" });

      const items = await processMenuFile(csvFile, { ocrEngine: "paddle" });

      expect(items).toHaveLength(2);
      expect(items[0].name).toBe("Masala Dosa");
      expect(items[0].price).toBe(120);
      expect(items[1].name).toBe("Idli");
      expect(items[1].price).toBe(50);
    });
  });

  describe("Batch Processing & Progress Updates", () => {
    it("reports progress per file and aggregates results", async () => {
      const file1 = new File(["Dish 1 100"], "file1.csv", { type: "text/csv" });
      const file2 = new File(["Dish 2 200"], "file2.csv", { type: "text/csv" });

      const progressRecords: { fileIdx: number; progress: number }[] = [];

      const results = await processMenuFilesBatch(
        [file1, file2],
        { ocrEngine: "paddle" },
        (idx, res) => {
          progressRecords.push({ fileIdx: idx, progress: res.progress });
        }
      );

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe("completed");
      expect(results[1].status).toBe("completed");
      expect(progressRecords.length).toBeGreaterThan(0);
    });
  });
});
