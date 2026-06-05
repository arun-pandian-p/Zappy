import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageCropDialog } from "./ImageCropDialog";

interface BannerLogoUploaderProps {
  restaurantId: string;
  restaurantName: string;
  bannerUrl?: string | null;
  logoUrl?: string | null;
  onBannerChange: (url: string) => void;
  onLogoChange: (url: string) => void;
}

export function BannerLogoUploader({
  restaurantId,
  restaurantName,
  bannerUrl,
  logoUrl,
  onBannerChange,
  onLogoChange,
}: BannerLogoUploaderProps) {
  const { toast } = useToast();
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<"banner" | "logo" | null>(null);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "banner" | "logo"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, WEBP).",
        variant: "destructive",
      });
      return;
    }

    if (target === "banner") setUploadingBanner(true);
    else setUploadingLogo(true);

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${restaurantId}/branding/temp_${target}_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("menu-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("menu-images")
        .getPublicUrl(data.path);

      setCropSrc(urlData.publicUrl);
      setCropTarget(target);
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploadingBanner(false);
      setUploadingLogo(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleCropComplete = (croppedUrl: string) => {
    if (cropTarget === "banner") {
      onBannerChange(croppedUrl);
      toast({ title: "Banner updated" });
    } else if (cropTarget === "logo") {
      onLogoChange(croppedUrl);
      toast({ title: "Logo updated" });
    }
    setCropSrc(null);
    setCropTarget(null);
  };

  return (
    <div className="relative space-y-4">
      {/* Hidden inputs */}
      <input
        type="file"
        ref={bannerInputRef}
        onChange={(e) => handleFileChange(e, "banner")}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={logoInputRef}
        onChange={(e) => handleFileChange(e, "logo")}
        accept="image/*"
        className="hidden"
      />

      {/* Banner Area */}
      <div
        onClick={() => !uploadingBanner && bannerInputRef.current?.click()}
        className="relative h-48 w-full rounded-xl overflow-hidden border border-border bg-slate-100 hover:bg-slate-200 cursor-pointer group transition-all"
      >
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt="Restaurant Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
            <Camera className="w-8 h-8 opacity-60" />
            <span>Click to upload hero cover banner (Recommended 1584×396px)</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2">
          {uploadingBanner ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Camera className="w-5 h-5" />
              <span className="text-sm font-medium">Change Banner Image</span>
            </>
          )}
        </div>
      </div>

      {/* Logo Area (overlapping bottom left of banner, but offset here for a clean layout) */}
      <div className="flex items-end gap-4 px-4 -mt-12 relative z-10">
        <div
          onClick={() => !uploadingLogo && logoInputRef.current?.click()}
          className="relative w-24 h-24 rounded-full border-4 border-background bg-card overflow-hidden shadow-md cursor-pointer group shrink-0"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Restaurant Logo"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-slate-50">
              <span className="text-2xl font-bold">
                {restaurantName ? restaurantName.charAt(0).toUpperCase() : "R"}
              </span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
            {uploadingLogo ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </div>
        </div>

        <div className="mb-2">
          <h3 className="font-bold text-lg text-foreground">{restaurantName || "Restaurant Name"}</h3>
          <p className="text-xs text-muted-foreground">Click image or logo circle to update branding</p>
        </div>
      </div>

      {/* Crop Dialog */}
      {cropSrc && cropTarget && (
        <ImageCropDialog
          open={!!cropSrc}
          imageSrc={cropSrc}
          onClose={() => {
            setCropSrc(null);
            setCropTarget(null);
          }}
          onCropComplete={handleCropComplete}
          cropShape={cropTarget === "logo" ? "round" : "rect"}
          aspect={cropTarget === "logo" ? 1 : 4}
          title={cropTarget === "logo" ? "Crop Restaurant Logo" : "Crop Banner Image"}
          uploadPath={{ restaurantId, folder: "branding" }}
        />
      )}
    </div>
  );
}
