import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface Ad {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  link_url?: string | null;
}

interface AdsPopupProps {
  ad: Ad | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyCoupon?: (code: string) => void;
  onSkip?: () => void;
  onClickThrough?: () => void;
}

export function AdsPopup({
  ad,
  open,
  onOpenChange,
  onApplyCoupon,
  onSkip,
  onClickThrough,
}: AdsPopupProps) {
  if (!ad) return null;

  // Extract coupon code from description (format: "Use coupon code: CODE")
  const couponMatch = ad.description?.match(/coupon\s*code[:\s]+([A-Z0-9]+)/i);
  const couponCode = couponMatch?.[1];

  const handleApply = () => {
    if (couponCode && onApplyCoupon) {
      onApplyCoupon(couponCode);
    }
    onOpenChange(false);
  };

  const handleSkip = () => {
    onSkip?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl border-0">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 z-20 bg-foreground/80 hover:bg-foreground text-background rounded-full h-8 w-8"
          onClick={() => onOpenChange(false)}
        >
          <X className="w-4 h-4" />
        </Button>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Ad Image */}
          {ad.image_url && (
            <div 
              className="relative cursor-pointer"
              onClick={onClickThrough}
            >
              <img
                src={ad.image_url}
                alt={ad.title}
                className="w-full aspect-[4/5] object-cover"
              />
              
              {/* Overlay content on image */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Coupon Badge - Bottom of image */}
              {couponCode && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <div className="bg-warning text-warning-foreground px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                    Use coupon code: <span className="font-black">{couponCode}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* If no image, show text content */}
          {!ad.image_url && (
            <div className="p-6 text-center">
              <h3 className="font-bold text-xl mb-2">{ad.title}</h3>
              {ad.description && (
                <p className="text-muted-foreground">{ad.description}</p>
              )}
              {couponCode && (
                <div className="mt-4 bg-warning/20 text-warning px-4 py-2 rounded-lg font-bold">
                  Use code: {couponCode}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 p-4 bg-card border-t">
            {couponCode ? (
              <>
                <Button
                  onClick={handleApply}
                  className="flex-1 bg-success hover:bg-success/90 text-success-foreground font-semibold"
                >
                  Apply Coupon
                </Button>
                <span className="text-muted-foreground">|</span>
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground font-medium"
                >
                  Skip
                </Button>
              </>
            ) : (
              <Button
                onClick={handleSkip}
                variant="outline"
                className="w-full"
              >
                Continue to Menu
              </Button>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
