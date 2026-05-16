import { generateItemDescription } from "./ocrService";
import { syncImageToSupabase } from "./storageService";
import { supabase } from "@/integrations/supabase/client";

export async function generateFoodImage(itemName: string, description: string, restaurantId: string): Promise<string> {
  console.log(`Generating AI image for: ${itemName}`);
  
  // 1. Enhance description locally if it's too short
  let enhancedDesc = description;
  if (!description || description.length < 10) {
    enhancedDesc = generateItemDescription(itemName);
  }

  // 2. Fetch from a high-quality food image source (Pollinations AI)
  const aiPrompt = encodeURIComponent(`${itemName}, ${enhancedDesc}, professional food photography, 4k, delicious, restaurant style`);
  const externalUrl = `https://image.pollinations.ai/prompt/${aiPrompt}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
  
  // 3. Sync to Supabase storage to make it permanent
  return await syncImageToSupabase(externalUrl, restaurantId, "menu", itemName.toLowerCase().replace(/\s+/g, "_"));
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
