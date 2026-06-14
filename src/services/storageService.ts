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
    console.log(`Syncing external image to Supabase: ${externalUrl.substring(0, 100)}...`);
    
    let blob: Blob;
    
    if (externalUrl.startsWith("data:image")) {
      const arr = externalUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      blob = new Blob([u8arr], { type: mime });
    } else {
      // 1. Fetch the image via a CORS proxy
      const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(externalUrl)}`;
      const response = await fetch(proxiedUrl);
      blob = await response.blob();
    }
    
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
