import { OpenAIClient } from "./client";

export class OpenAITranslationService {
  static async translate(text: string, targetLanguage: string): Promise<string> {
    const apiKey = await OpenAIClient.getApiKey();
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: `You are a professional restaurant menu translator. Translate the given text to ${targetLanguage}. Return ONLY the translated text.` },
          { role: "user", content: text }
        ]
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
  }
}
