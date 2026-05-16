/**
 * 🤖 List Google Gemini Models
 * Fetches the list of available models from the Google Generative AI API.
 * 
 * Usage: node scripts/ai/list_models.cjs
 */
const GEMINI_API_KEY = "AIzaSyA0YMUpQSs54UNbQS5-29nTDcIcf-wJwN4";

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}
listModels();
