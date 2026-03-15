import { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, ImageIcon, RefreshCw, Crop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageCropDialog } from '@/components/admin/ImageCropDialog';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  restaurantId: string;
  folder?: string;
  maxSizeMB?: number;
  /** Enable crop dialog after selecting an image */
  enableCrop?: boolean;
  /** Crop shape: 'round' for logos, 'rect' for banners */
  cropShape?: 'round' | 'rect';
  /** Aspect ratio for crop (e.g. 1 for square, 3 for banner) */
  cropAspect?: number;
}

export const ImageUpload = ({ 
  currentImageUrl, 
  onImageUploaded, 
  restaurantId,
  folder = 'items',
  maxSizeMB,
  enableCrop = false,
  cropShape = 'rect',
  cropAspect = 1,
}: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setPreviewUrl(currentImageUrl || null);
  }, [currentImageUrl]);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${restaurantId}/${folder}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(data.path);

      const publicUrl = urlData.publicUrl;
      pendingFileRef.current = null;

      if (enableCrop) {
        // Open crop dialog with the uploaded image
        setCropSrc(publicUrl);
      } else {
        setPreviewUrl(publicUrl);
        onImageUploaded(publicUrl);
        toast({ title: 'Image uploaded', description: 'Image has been uploaded successfully.' });
      }
    } catch (error: any) {
      console.error('[ImageUpload] Upload error:', error);
      const msg = error?.message || 'Network error. Please try again.';
      setUploadError(msg);
      pendingFileRef.current = file;
      toast({ title: 'Upload failed', description: msg, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please select an image file (JPG, PNG, WEBP).', variant: 'destructive' });
      return;
    }

    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      toast({ title: 'File too large', description: `Please select an image under ${maxSizeMB}MB.`, variant: 'destructive' });
      return;
    }

    await uploadFile(file);
  };

  const handleRetry = async () => {
    if (pendingFileRef.current) await uploadFile(pendingFileRef.current);
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setUploadError(null);
    pendingFileRef.current = null;
    onImageUploaded('');
  };

  const handleCropComplete = (croppedUrl: string) => {
    setPreviewUrl(croppedUrl);
    onImageUploaded(croppedUrl);
    setCropSrc(null);
    toast({ title: 'Image cropped & saved' });
  };

  const handleCropClose = () => {
    // If user cancels crop, use the original uploaded image
    if (cropSrc) {
      setPreviewUrl(cropSrc);
      onImageUploaded(cropSrc);
    }
    setCropSrc(null);
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative w-full h-32 rounded-lg overflow-hidden border bg-muted">
          <img
            src={previewUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
          />
          <div className="absolute top-2 right-2 flex gap-1">
            {enableCrop && (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-6 w-6"
                onClick={() => setCropSrc(previewUrl)}
                title="Crop image"
              >
                <Crop className="w-3 h-3" />
              </Button>
            )}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-6 w-6"
              onClick={handleRemoveImage}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-8 h-8" />
              <span className="text-sm">Click to upload image</span>
              {maxSizeMB && <span className="text-xs">Max {maxSizeMB}MB</span>}
            </>
          )}
        </button>
      )}

      {uploadError && !isUploading && (
        <div className="flex items-center gap-2">
          <p className="text-xs text-destructive flex-1">Upload failed: {uploadError}</p>
          {pendingFileRef.current && (
            <Button type="button" variant="outline" size="sm" onClick={handleRetry} className="gap-1.5 text-xs">
              <RefreshCw className="w-3 h-3" />
              Retry
            </Button>
          )}
        </div>
      )}

      {!previewUrl && !isUploading && !uploadError && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          Choose Image
        </Button>
      )}

      {/* Crop Dialog */}
      {enableCrop && (
        <ImageCropDialog
          open={!!cropSrc}
          imageSrc={cropSrc || ''}
          onClose={handleCropClose}
          onCropComplete={handleCropComplete}
          cropShape={cropShape}
          aspect={cropAspect}
          title="Crop Image"
          uploadPath={{ restaurantId, folder }}
        />
      )}
    </div>
  );
};