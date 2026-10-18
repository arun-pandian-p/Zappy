import { supabase } from "@/integrations/supabase/client";

/**
 * Downloads an external image or data URL and uploads it to Supabase storage.
 * Automatically indexes the image into public.image_library for persistent reuse.
 * Returns the public URL of the uploaded image.
 */
export async function syncImageToSupabase(
  externalUrl: string,
  restaurantId?: string,
  folder: "menu" | "offers" | "branding" | "items" = "menu",
  fileName?: string,
  source: "unsplash" | "ai" | "upload" = "upload"
): Promise<string> {
  const targetRestaurantId = restaurantId || "ba349c16-9643-41dd-a70f-b01c64aeabd4";
  
  if (!externalUrl) return "";

  // If already a persistent Supabase Storage URL in menu-images or item-images, return directly
  if (externalUrl.includes("supabase.co/storage/v1/object/public/")) {
    return externalUrl;
  }

  try {
    console.log(`Syncing image to Supabase Storage: ${externalUrl.substring(0, 100)}...`);
    
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
      // 1. Try direct fetch first (works for Unsplash with Access-Control-Allow-Origin: *)
      try {
        const directRes = await fetch(externalUrl, { mode: 'cors' });
        if (directRes.ok) {
          blob = await directRes.blob();
        } else {
          throw new Error(`Direct fetch returned ${directRes.status}`);
        }
      } catch (directErr) {
        // Fallback to CORS proxies
        console.warn("Direct fetch failed, attempting proxy:", directErr);
        try {
          const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(externalUrl)}`;
          const proxyRes = await fetch(proxiedUrl);
          if (proxyRes.ok) {
            blob = await proxyRes.blob();
          } else {
            throw new Error(`Proxy returned ${proxyRes.status}`);
          }
        } catch {
          const altProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(externalUrl)}`;
          const altRes = await fetch(altProxyUrl);
          blob = await altRes.blob();
        }
      }
    }
    
    // 2. Generate a clean file name and path
    const ext = blob.type.split("/")[1]?.replace(/[^a-zA-Z0-9]/g, '') || "jpg";
    const cleanFileName = fileName 
      ? `${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}` 
      : `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = `${targetRestaurantId}/${folder}/${cleanFileName}`;

    // 3. Upload to 'menu-images' bucket
    const { data, error } = await supabase.storage
      .from("menu-images")
      .upload(filePath, blob, {
        contentType: blob.type || "image/jpeg",
        upsert: true
      });

    if (error) throw error;

    // 4. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("menu-images")
      .getPublicUrl(filePath);

    // 5. Index into image_library for persistent reuse
    const itemName = fileName ? fileName.replace(/_/g, ' ') : 'Uploaded Dish';
    try {
      await supabase.from('image_library').insert({
        image_url: publicUrl,
        item_name: itemName,
        category_name: folder === 'branding' ? 'Branding' : 'Menu',
        source: source
      } as any);
    } catch (libErr) {
      console.warn("Could not index in image_library:", libErr);
    }

    return publicUrl;
  } catch (error) {
    console.error("Failed to sync image to Supabase Storage:", error);
    return externalUrl; // Fallback to external URL if sync completely fails
  }
}

