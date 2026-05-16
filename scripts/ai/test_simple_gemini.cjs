/**
 * ⚡ Simple Gemini Test
 * Basic sanity check to verify Gemini API connectivity.
 * 
 * Usage: node scripts/ai/test_simple_gemini.cjs
 */
const GEMINI_API_KEY = "AIzaSyA0YMUpQSs54UNbQS5-29nTDcIcf-wJwN4";
const GEMINI_MODEL = "gemini-1.5-flash";

async function testSimple() {
  const url = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello" }] }]
      }),
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}
testSimple();
