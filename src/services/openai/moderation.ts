import { OpenAIClient } from "./client";

export class OpenAIModerationService {
  static async checkContent(text: string): Promise<boolean> {
    const apiKey = await OpenAIClient.getApiKey();
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({ input: text })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.results[0].flagged;
  }
}
