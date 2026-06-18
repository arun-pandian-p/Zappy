import { executeOpenAIChatCall } from "../openaiService";

export class OpenAITranslationService {
  static async translate(text: string, targetLanguage: string, restaurantId?: string): Promise<string> {
    const rid = restaurantId || "00000000-0000-0000-0000-000000000001";
    return executeOpenAIChatCall(
      rid,
      "translation",
      [
        { role: "system", content: `You are a professional restaurant menu translator. Translate the given text to ${targetLanguage}. Return ONLY the translated text.` },
        { role: "user", content: text }
      ]
    );
  }
}
