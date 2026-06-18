import { executeOpenAIChatCall } from "../openaiService";

export class OpenAIModerationService {
  static async checkContent(text: string, restaurantId?: string): Promise<boolean> {
    const rid = restaurantId || "00000000-0000-0000-0000-000000000001";
    const response = await executeOpenAIChatCall(
      rid,
      "moderation",
      [
        { role: "system", content: "Analyze if the following user content requires moderation. Return JSON: {\"flagged\": boolean, \"categories\": string[]}" },
        { role: "user", content: text }
      ],
      { type: "json_object" }
    );
    try {
      const parsed = JSON.parse(response);
      return parsed.flagged === true;
    } catch {
      return false;
    }
  }
}
