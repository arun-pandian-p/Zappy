import { generateItemDescription } from "./ocrService";
import { syncImageToSupabase } from "./storageService";
import { supabase } from "@/integrations/supabase/client";
import { tracer } from "./telemetry";
import { SpanStatusCode } from "@opentelemetry/api";

export async function generateFoodImage(itemName: string, description: string, restaurantId: string): Promise<string> {
  return tracer.startActiveSpan("generateFoodImage", async (span) => {
    span.setAttribute("llm.prompt_template.template", "{{itemName}}, {{description}}, professional food photography, 4k, delicious, restaurant style");
    span.setAttribute("llm.prompt_template.variables", JSON.stringify({ itemName, description }));
    span.setAttribute("llm.prompt_template.version", "1.0.0");

    try {
      console.log(`Generating AI image for: ${itemName}`);
      
      // 1. Enhance description locally if it's too short
      let enhancedDesc = description;
      if (!description || description.length < 10) {
        enhancedDesc = generateItemDescription(itemName);
      }

      // 2. Fetch from a high-quality food image source (Pollinations AI)
      const rawPrompt = `${itemName}, ${enhancedDesc}, professional food photography, 4k, delicious, restaurant style`;
      span.setAttribute("llm.prompts", rawPrompt);

      // Estimate tokens
      const promptTokens = Math.round(rawPrompt.length / 4);
      span.setAttribute("llm.token_count.prompt", promptTokens);

      const aiPrompt = encodeURIComponent(rawPrompt);
      const externalUrl = `https://image.pollinations.ai/prompt/${aiPrompt}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
      
      // 3. Sync to Supabase storage to make it permanent
      const finalUrl = await syncImageToSupabase(externalUrl, restaurantId, "menu", itemName.toLowerCase().replace(/\s+/g, "_"));
      
      const completionTokens = Math.round(finalUrl.length / 4);
      span.setAttribute("llm.token_count.completion", completionTokens);
      span.setAttribute("llm.token_count.total", promptTokens + completionTokens);
      span.setStatus({ code: SpanStatusCode.OK });
      return finalUrl;
    } catch (err: any) {
      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      throw err;
    } finally {
      span.end();
    }
  });
}

export async function bulkEnrichMenu(restaurantId: string, items: any[]) {
  const itemsToUpdate = items.filter(item => !item.image_url);
  console.log(`Enriching ${itemsToUpdate.length} items with descriptions and images...`);
  
  for (const item of itemsToUpdate) {
    const imageUrl = await generateFoodImage(item.name, item.description || "", restaurantId);
    const description = generateItemDescription(item.name);
    
    // Update Supabase
    await supabase
      .from("menu_items")
      .update({ image_url: imageUrl, description: description })
      .eq("id", item.id);
  }
}
