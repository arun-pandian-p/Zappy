import { executeOpenAIImageCall } from "../openaiService";

export class OpenAIImageService {
  static async generate(prompt: string, restaurantId?: string): Promise<string> {
    const rid = restaurantId || "00000000-0000-0000-0000-000000000001";
    return executeOpenAIImageCall(rid, prompt, "low");
  }
}
