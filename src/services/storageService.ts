import { supabase } from "@/integrations/supabase/client";

/**
 * Downloads an external image and uploads it to Supabase storage.
 * Returns the public URL of the uploaded image.
 */
export async function syncImageToSupabase(
  externalUrl: string,
  restaurantId: string,
  folder: "menu" | "offers" | "branding" = "menu",
  fileName?: string
): Promise<string> {
  try {
    console.log(`Syncing external image to Supabase: ${externalUrl}`);
    
    // 1. Fetch the image via a CORS proxy
    const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(externalUrl)}`;
    const response = await fetch(proxiedUrl);
    const blob = await response.blob();
    
    // 2. Generate a unique file name
    const ext = blob.type.split("/")[1] || "jpg";
    const name = fileName ? `${fileName}.${ext}` : `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = `${restaurantId}/${folder}/${name}`;

    // 3. Upload to 'menu-images' bucket
    const { data, error } = await supabase.storage
      .from("menu-images")
      .upload(filePath, blob, {
        contentType: blob.type,
        upsert: true
      });

    if (error) throw error;

    // 4. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("menu-images")
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Failed to sync image to Supabase:", error);
    return externalUrl; // Fallback to external URL if sync fails
  }
}
