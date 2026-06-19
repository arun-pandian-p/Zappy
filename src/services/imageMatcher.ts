import { supabase } from "@/integrations/supabase/client";

interface StorageImage {
  id: string;
  item_name: string;
  category_name: string | null;
  image_url: string;
}

export class ImageMatcher {
  private static images: StorageImage[] = [];
  private static initialized = false;

  /**
   * Fetch the entire image library index from Supabase
   */
  static async initialize(forceRefresh = false) {
    if (this.initialized && !forceRefresh) return;
    
    try {
      const { data, error } = await supabase
        .from('image_library')
        .select('id, item_name, category_name, image_url');
      
      if (error) throw error;
      this.images = data || [];
      this.initialized = true;
      console.log(`[ImageMatcher] Loaded ${this.images.length} images from Storage.`);
    } catch (e) {
      console.error("[ImageMatcher] Failed to fetch image library for matching:", e);
    }
  }

  /**
   * Find the best image match for a given item name and category.
   * Returns the image_url if a match is found, otherwise null.
   */
  static findBestMatch(name: string, category: string): string | null {
    if (!this.images.length) return null;

    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normName = normalize(name);
    const normCat = normalize(category);

    let bestMatch: string | null = null;
    let highestScore = 0;

    for (const img of this.images) {
      if (!img.item_name) continue;
      
      const imgNormName = normalize(img.item_name);
      const imgNormCat = img.category_name ? normalize(img.category_name) : "";

      let score = 0;

      // Exact name match
      if (imgNormName === normName) {
        score += 50;
      } 
      // Partial name match (one contains the other, and is reasonably long to prevent false positives)
      else if (imgNormName.length > 3 && normName.length > 3 && 
              (imgNormName.includes(normName) || normName.includes(imgNormName))) {
        score += 30;
      }

      // Category match boost
      if (imgNormCat && normCat && imgNormCat === normCat) {
        score += 20;
      }

      // We need a minimum score of 30 to consider it a match
      if (score > highestScore && score >= 30) {
        highestScore = score;
        bestMatch = img.image_url;
      }
    }

    if (bestMatch) {
      console.log(`[ImageMatcher] Found match for "${name}" (Score: ${highestScore})`);
    }

    return bestMatch;
  }
}
