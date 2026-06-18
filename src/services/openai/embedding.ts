import { executeOpenAIEmbeddingCall } from "../openaiService";

export class OpenAIEmbeddingService {
  static async generate(text: string, restaurantId?: string): Promise<number[]> {
    const rid = restaurantId || "00000000-0000-0000-0000-000000000001";
    const embeddings = await executeOpenAIEmbeddingCall(rid, [text]);
    return embeddings[0];
  }
}
