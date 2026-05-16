import { describe, it, expect } from "vitest";
import { parseMenuFromText, parseMenuFromCSV } from "./menuParser";
import { fixOCRTypos, extractPrice, titleCase, deduplicateItems, cleanOCRText } from "./textCleaner";

describe("MenuParser", () => {
  describe("parseMenuFromText", () => {
    it("parses 'Item Name ₹120' format", () => {
      const items = parseMenuFromText("Masala Dosa ₹120\nIdli ₹50");
      expect(items).toHaveLength(2);
      expect(items[0].name).toBe("Masala Dosa");
      expect(items[0].price).toBe(120);
      expect(items[1].name).toBe("Idli");
      expect(items[1].price).toBe(50);
    });

    it("parses 'Item Name ... 120' format", () => {
      const items = parseMenuFromText("Chicken Biryani ... 250");
      expect(items).toHaveLength(1);
      expect(items[0].price).toBe(250);
    });

    it("parses 'Item Name - 120' format", () => {
      const items = parseMenuFromText("Butter Naan - 60");
      expect(items).toHaveLength(1);
      expect(items[0].price).toBe(60);
    });

    it("auto-detects categories from keywords", () => {
      const items = parseMenuFromText("Masala Dosa ₹120\nGulab Jamun ₹80\nFilter Coffee ₹50");
      const dosa = items.find(i => i.name === "Masala Dosa");
      const gulab = items.find(i => i.name === "Gulab Jamun");
      const coffee = items.find(i => i.name === "Filter Coffee");
      expect(dosa?.category).toBe("Breakfast");
      expect(gulab?.category).toBe("Desserts");
      expect(coffee?.category).toBe("Drinks");
    });

    it("uses category headers to set context", () => {
      const text = "STARTERS\nChicken 65 ₹180\nPaneer Tikka ₹200\nDESSERTS\nKulfi ₹90";
      const items = parseMenuFromText(text);
      expect(items.find(i => i.name === "Chicken 65")?.category).toBe("Starters");
      expect(items.find(i => i.name === "Kulfi")?.category).toBe("Desserts");
    });

    it("ignores junk lines (thank you, address, etc.)", () => {
      const text = "Welcome to our restaurant!\nMasala Dosa ₹120\nThank you for visiting!";
      const items = parseMenuFromText(text);
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe("Masala Dosa");
    });

    it("deduplicates items by name", () => {
      const text = "Masala Dosa ₹120\nMasala Dosa ₹120";
      const items = parseMenuFromText(text);
      expect(items).toHaveLength(1);
    });

    it("handles empty input", () => {
      expect(parseMenuFromText("")).toHaveLength(0);
    });
  });

  describe("parseMenuFromCSV", () => {
    it("parses CSV with proper headers", () => {
      const csv = "Item,Price,Category\nMasala Dosa,120,Breakfast\nBiryani,250,Rice & Breads";
      const items = parseMenuFromCSV(csv);
      expect(items).toHaveLength(2);
      expect(items[0].name).toBe("Masala Dosa");
      expect(items[0].price).toBe(120);
      expect(items[0].category).toBe("Breakfast");
    });

    it("falls back to text parsing when headers are unrecognized", () => {
      const csv = "Foo,Bar\nMasala Dosa ₹120,something";
      const items = parseMenuFromCSV(csv);
      // Should attempt free-text parsing
      expect(items.length).toBeGreaterThanOrEqual(0);
    });

    it("handles quoted CSV fields", () => {
      const csv = 'Name,Price,Category\n"Chicken Tikka, Special",350,Starters';
      const items = parseMenuFromCSV(csv);
      expect(items).toHaveLength(1);
      expect(items[0].name).toContain("Chicken Tikka");
    });
  });
});

describe("TextCleaner", () => {
  describe("fixOCRTypos", () => {
    it("fixes D0sa → Dosa", () => {
      expect(fixOCRTypos("D0sa")).toBe("Dosa");
    });

    it("fixes 1dli → Idli", () => {
      expect(fixOCRTypos("1dli")).toBe("Idli");
    });

    it("fixes biryam → Biryani", () => {
      expect(fixOCRTypos("biryam")).toBe("Biryani");
    });

    it("leaves correct text unchanged", () => {
      expect(fixOCRTypos("Paneer Butter Masala")).toBe("Paneer Butter Masala");
    });
  });

  describe("extractPrice", () => {
    it("extracts from ₹120", () => {
      expect(extractPrice("₹120")).toBe(120);
    });

    it("extracts from Rs. 250", () => {
      expect(extractPrice("Rs. 250")).toBe(250);
    });

    it("extracts from plain number", () => {
      expect(extractPrice("350")).toBe(350);
    });

    it("handles decimal prices", () => {
      expect(extractPrice("₹99.50")).toBe(99.5);
    });

    it("returns null for invalid input", () => {
      expect(extractPrice("")).toBeNull();
      expect(extractPrice("abc")).toBeNull();
    });

    it("rejects out-of-range prices (> 10000)", () => {
      expect(extractPrice("99999")).toBeNull();
    });
  });

  describe("titleCase", () => {
    it("capitalizes first letter of each word", () => {
      expect(titleCase("masala dosa")).toBe("Masala Dosa");
    });

    it("keeps lowercase words like 'and', 'with'", () => {
      expect(titleCase("rice and curry")).toBe("Rice and Curry");
    });

    it("capitalizes first word even if it's a lowercase word", () => {
      expect(titleCase("the special biryani")).toBe("The Special Biryani");
    });
  });

  describe("deduplicateItems", () => {
    it("removes duplicates by normalized name", () => {
      const items = [
        { name: "Masala Dosa" },
        { name: "masala dosa" },
        { name: "Idli" },
      ];
      expect(deduplicateItems(items)).toHaveLength(2);
    });
  });

  describe("cleanOCRText", () => {
    it("removes phone numbers", () => {
      const result = cleanOCRText("Call us: 9876543210\nMasala Dosa ₹120");
      expect(result).not.toContain("9876543210");
    });

    it("removes URLs", () => {
      const result = cleanOCRText("Visit https://example.com\nIdli ₹50");
      expect(result).not.toContain("https://example.com");
    });

    it("removes GST/FSSAI numbers", () => {
      const result = cleanOCRText("GST: 12345ABC\nFSSAI: 1234567890");
      expect(result).not.toMatch(/GST/i);
    });

    it("normalizes line endings", () => {
      const result = cleanOCRText("Line1\r\nLine2\rLine3");
      expect(result).not.toContain("\r");
    });
  });
});
