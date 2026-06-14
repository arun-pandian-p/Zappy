import { OpenAIClient } from "./client";

export class OpenAIEmbeddingService {
  static async generate(text: string): Promise<number[]> {
    const apiKey = await OpenAIClient.getApiKey();
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.data[0].embedding;
  }
}
