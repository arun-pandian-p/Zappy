import { useState, useEffect } from "react";
import { Bell, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedHotelName, type LetterAnimation, type AnimationSpeed } from "@/components/branding/AnimatedHotelName";
import { MascotIcon, type MascotType } from "@/components/branding/MascotIcon";

interface BrandingConfig {
  animation_enabled?: boolean;
  letter_animation?: LetterAnimation;
  mascot?: MascotType;
  mascot_image_url?: string;
  animation_speed?: AnimationSpeed;
  glow_color_sync?: boolean;
}

interface CustomerTopBarProps {
  restaurantName: string;
  logoUrl?: string | null;
  bannerImageUrl?: string | null;
  tableNumber: string;
  cartCount: number;
  onCallWaiter: () => void;
  onCartClick: () => void;
  isCallingWaiter?: boolean;
  primaryColor?: string;
  branding?: BrandingConfig;
  restaurantId?: string;
}

export function CustomerTopBar({
  restaurantName,
  logoUrl,
  bannerImageUrl,
  tableNumber,
  cartCount,
  onCallWaiter,
  onCartClick,
  isCallingWaiter,
  primaryColor,
  branding,
  restaurantId,
}: CustomerTopBarProps) {
  const navigate = useNavigate();
  const animEnabled = branding?.animation_enabled ?? false;
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);

  // Reset fallback states when URLs change (tenant switch)
  useEffect(() => { setLogoFailed(false); }, [logoUrl]);
  useEffect(() => { setBannerFailed(false); }, [bannerImageUrl]);

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (v) => setIsScrolled(v > 30));
    return () => unsubscribe();
  }, [scrollY]);

  return (
    <div className="sticky top-0 z-50">
      {/* Banner Image — collapses on scroll */}
      {/* Banner Image — smoothly collapses on scroll */}
      {bannerImageUrl && !bannerFailed && (
        <motion.div
          animate={{ height: isScrolled ? 0 : 80, opacity: isScrolled ? 0 : 1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative w-full overflow-hidden"
        >
          <img
            src={bannerImageUrl}
            alt=""
            className="w-full h-[80px] object-cover"
            onError={() => setBannerFailed(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        </motion.div>
      )}

      {/* Top Bar */}
      <motion.header
        className={`transition-all duration-300 border-b ${
          isScrolled
            ? "bg-card/95 backdrop-blur-xl shadow-sm py-2"
            : bannerImageUrl
            ? "bg-card/90 backdrop-blur-md py-2"
            : "bg-card py-2"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Left: Avatar + Greeting + Table */}
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Breeze"
                alt="User Avatar"
                className="w-12 h-12 rounded-full border border-border bg-muted object-cover"
              />
              <div className="flex flex-col min-w-0">
                <h1 className="font-medium text-sm text-muted-foreground flex items-center gap-1 truncate">
                  Hello, <span className="font-bold text-foreground text-base">Breeze Bhai</span> <span className="text-base">👋</span>
                </h1>
                {tableNumber && (
                  <div className="mt-0.5">
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-2 py-0.5 h-auto font-medium bg-background border shadow-sm text-muted-foreground"
                    >
                      <div className="w-3 h-3 rounded-sm bg-muted flex items-center justify-center mr-1 pb-0.5 border">
                        <span className="text-[8px] font-bold">T</span>
                      </div>
                      Table {tableNumber}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Bell + Exit */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="relative rounded-full h-10 w-10 bg-background border-border shadow-sm"
                onClick={onCallWaiter}
                disabled={isCallingWaiter}
              >
                <Bell className="w-5 h-5 text-foreground" />
                <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-destructive border-2 border-background" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="relative rounded-[12px] h-10 w-10 bg-background border-border shadow-sm"
                onClick={() => navigate('/login')}
                title="Exit/Login"
              >
                <LogIn className="w-5 h-5 text-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>
    </div>
  );
}
