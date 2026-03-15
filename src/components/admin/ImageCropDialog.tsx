import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCw, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedImageUrl: string) => void;
  cropShape?: 'round' | 'rect';
  aspect?: number;
  title?: string;
  /** If provided, uploads cropped image to storage and returns URL instead of base64 */
  uploadPath?: { restaurantId: string; folder: string };
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob'));
    }, 'image/jpeg', 0.9);
  });
}

export function ImageCropDialog({
  open,
  imageSrc,
  onClose,
  onCropComplete,
  cropShape = 'round',
  aspect = 1,
  title = 'Crop Image',
  uploadPath,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropCompleteInternal = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);

      if (uploadPath) {
        // Upload cropped image to storage — returns a proper URL
        const fileName = `${uploadPath.restaurantId}/${uploadPath.folder}/cropped_${Date.now()}.jpg`;
        const { data, error } = await supabase.storage
          .from('menu-images')
          .upload(fileName, blob, { cacheControl: '3600', upsert: true, contentType: 'image/jpeg' });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('menu-images')
          .getPublicUrl(data.path);

        onCropComplete(urlData.publicUrl);
      } else {
        // Fallback: return data URL (legacy behavior)
        const reader = new FileReader();
        reader.onloadend = () => {
          onCropComplete(reader.result as string);
        };
        reader.readAsDataURL(blob);
      }
    } catch (e) {
      console.error('Crop error:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="relative w-full h-72 sm:h-80 bg-black/90">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropCompleteInternal}
          />
        </div>

        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.05}
              onValueChange={([v]) => setZoom(v)}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>

          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRotation((r) => (r + 90) % 360)}
            >
              <RotateCw className="w-4 h-4 mr-1" />
              Rotate
            </Button>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-1" />
            )}
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}