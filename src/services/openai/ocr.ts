import { OpenAIClient } from "./client";

export class OpenAIOcrService {
  static async extractMenuData(imageBase64: string): Promise<any> {
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
          {
            role: "user",
            content: [
              { type: "text", text: "Extract menu items from this image." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
            ]
          }
        ],
        response_format: { type: "json_object" }
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return JSON.parse(data.choices[0].message.content);
  }
}
