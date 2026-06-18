import { executeOpenAIVisionCall } from "../openaiService";

export class OpenAIOcrService {
  static async extractMenuData(imageBase64: string, restaurantId?: string): Promise<any> {
    const rid = restaurantId || "00000000-0000-0000-0000-000000000001";
    const response = await executeOpenAIVisionCall(
      rid,
      "ocr_menu_import_fallback",
      [`data:image/jpeg;base64,${imageBase64}`],
      "Extract menu items from this image."
    );
    return JSON.parse(response);
  }
}
