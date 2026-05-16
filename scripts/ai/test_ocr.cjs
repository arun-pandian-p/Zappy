/**
 * 🧠 Test Gemini OCR
 * Tests the Gemini AI OCR capability with PDF and CSV files.
 * 
 * Usage: node scripts/ai/test_ocr.cjs
 */
const fs = require('fs');
const path = require('path');

const GEMINI_API_KEY = "AIzaSyA0YMUpQSs54UNbQS5-29nTDcIcf-wJwN4";
const GEMINI_MODEL = "gemini-1.5-flash";

async function testOCR(filePath, mimeType) {
  console.log(`Testing OCR for ${filePath} (${mimeType})...`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const fileBuffer = fs.readFileSync(filePath);
  const fileBase64 = fileBuffer.toString('base64');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `
    You are a strict OCR and document parser for a restaurant menu system.
    Extract food items from this file and return a JSON array.
    The file could be an image, a PDF, or a document.
    
    CRITICAL RULES:
    - Fix typos: "1dli" -> "Idli", "D0sa" -> "Dosa"
    - Normalize price: Remove ₹, Rs, etc. Keep only the number.
    - Categories: Map items to standard categories (Breakfast, Main Course, Drinks, Snacks, Desserts).
    
    OUTPUT FORMAT (STRICT JSON ARRAY):
    [
      { "name": "Item Name", "price": 50, "category": "Breakfast", "description": "Short description" }
    ]
  `;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: fileBase64,
                },
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    console.log("Gemini Response Status:", response.status);
    if (data.error) {
        console.error("Gemini Error Details:", JSON.stringify(data.error, null, 2));
        return;
    }

    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("Raw Response Text:", textResponse);
    
    const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const items = JSON.parse(jsonMatch[0]);
      console.log("Extracted Items:", JSON.stringify(items, null, 2));
    } else {
      console.log("No JSON found in response");
    }
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}

// Test with the files mentioned by user
(async () => {
    await testOCR('menu_import.pdf', 'application/pdf');
    await testOCR('menu_import12.pdf', 'application/pdf');
    await testOCR('menu_import.csv', 'text/csv');
})();
