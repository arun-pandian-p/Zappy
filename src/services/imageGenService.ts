import { executeOpenAIImageCall } from "./openaiService";
import { syncImageToSupabase } from "./storageService";
import { supabase } from "@/integrations/supabase/client";
import { tracer } from "./telemetry";
import { SpanStatusCode } from "@opentelemetry/api";
import { enrichMenuItem } from "./imageDiscoveryService";

export async function generateFoodImage(
  itemName: string,
  category: string,
  restaurantId: string,
  quality: "low" | "medium" = "low"
): Promise<string> {
  return tracer.startActiveSpan("generateFoodImage", async (span) => {
    span.setAttribute("llm.prompt_template.template", "Professional food photography of {dish_name}, {category} dish, top-down angle, on a clean plate, restaurant menu style, natural lighting, appetizing, high detail, no text, no watermark");
    span.setAttribute("llm.prompt_template.variables", JSON.stringify({ itemName, category }));

    try {
      console.log(`Generating AI image for: ${itemName} (${category})`);
      
      const prompt = `Professional food photography of ${itemName}, ${category || 'signature'} dish, top-down angle, on a clean plate, restaurant menu style, natural lighting, appetizing, high detail, no text, no watermark`;
      span.setAttribute("llm.prompts", prompt);

      console.log("[Image Gen] Request Payload:", { model: "gpt-image-1", prompt, quality });

      // Call OpenAI DALL-E image generation
      const externalUrl = await executeOpenAIImageCall(restaurantId, prompt, quality);
      console.log("[Image Gen] API Response URL:", externalUrl.substring(0, 100) + "...");
      
      // Sync to Supabase storage to make it permanent
      const finalUrl = await syncImageToSupabase(
        externalUrl, 
        restaurantId, 
        "menu", 
        `${itemName.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`
      );
      console.log("[Image Gen] Storage Upload Result:", finalUrl);
      
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

  const BATCH_SIZE = 5;
  for (let i = 0; i < itemsToUpdate.length; i += BATCH_SIZE) {
    const batch = itemsToUpdate.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map(async (item) => {
        const startTime = Date.now();
        try {
          const categoryName = item.category?.name || "Main Course";
          const enriched = await enrichMenuItem(item.name, categoryName, restaurantId);

          const { error: menuError } = await supabase
            .from("menu_items")
            .update({
              image_url: enriched.imageUrl,
              description: enriched.mediumDescription || enriched.shortDescription,
              tags: enriched.tags
            })
            .eq("id", item.id);

          if (menuError) throw menuError;

          const { error: enrichmentError } = await supabase
            .from("ai_enrichments")
            .upsert({
              menu_item_id: item.id,
              short_description: enriched.shortDescription,
              medium_description: enriched.mediumDescription,
              seo_description: enriched.seoDescription,
              calories: enriched.nutrition.calories,
              protein: enriched.nutrition.protein,
              carbs: enriched.nutrition.carbs,
              fat: enriched.nutrition.fat,
              allergens: enriched.allergens,
              tags: enriched.tags,
              upsell_recommendations: enriched.recommendations,
              image_search_queries: [item.name]
            }, { onConflict: "menu_item_id" });

          if (enrichmentError) throw enrichmentError;

          await supabase
            .from("ocr_analytics_metrics")
            .insert({
              restaurant_id: restaurantId,
              action_type: 'ai_enrich',
              is_success: true,
              processing_time_ms: Date.now() - startTime
            });

          console.log(`Successfully enriched menu item: ${item.name}`);
        } catch (err: any) {
          console.error(`Failed to enrich item ${item.name}:`, err);
          await supabase
            .from("ocr_analytics_metrics")
            .insert({
              restaurant_id: restaurantId,
              action_type: 'ai_enrich',
              is_success: false,
              processing_time_ms: Date.now() - startTime
            });
        }
      })
    );
  }
}

