import { generateItemDescription } from "./ocrService";
import { syncImageToSupabase } from "./storageService";
import { supabase } from "@/integrations/supabase/client";
import { tracer } from "./telemetry";
import { SpanStatusCode } from "@opentelemetry/api";
import { enrichMenuItem } from "./imageDiscoveryService";

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
    const startTime = Date.now();
    try {
      // 1. Call the enrichment pipeline
      const categoryName = item.category?.name || "Main Course";
      const enriched = await enrichMenuItem(item.name, categoryName, restaurantId);

      // 2. Update menu_items with description, image_url, and tags
      const { error: menuError } = await supabase
        .from("menu_items")
        .update({
          image_url: enriched.imageUrl,
          description: enriched.mediumDescription || enriched.shortDescription,
          tags: enriched.tags
        })
        .eq("id", item.id);

      if (menuError) throw menuError;

      // 3. Persist detailed AI metadata in ai_enrichments
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

      // 4. Record success in analytics metrics
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
      // Record failure in analytics metrics
      await supabase
        .from("ocr_analytics_metrics")
        .insert({
          restaurant_id: restaurantId,
          action_type: 'ai_enrich',
          is_success: false,
          processing_time_ms: Date.now() - startTime
        });
    }
  }
}

