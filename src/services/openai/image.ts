import { OpenAIClient } from "./client";

export class OpenAIImageService {
  static async generate(prompt: string): Promise<string> {
    const apiKey = await OpenAIClient.getApiKey();
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json"
      })
    });
    
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.data[0].b64_json;
  }
}
