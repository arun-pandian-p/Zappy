import { useState, useEffect } from "react";
import { Bell, ShoppingCart } from "lucide-react";
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
  tableNumber: string;
  cartCount: number;
  onCallWaiter: () => void;
  onCartClick: () => void;
  isCallingWaiter?: boolean;
  primaryColor?: string;
  branding?: BrandingConfig;
}

export function CustomerTopBar({
  restaurantName,
  logoUrl,
  tableNumber,
  cartCount,
  onCallWaiter,
  onCartClick,
  isCallingWaiter,
  primaryColor,
  branding,
}: CustomerTopBarProps) {
  const animEnabled = branding?.animation_enabled ?? false;
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (v) => setIsScrolled(v > 30));
    return () => unsubscribe();
  }, [scrollY]);

  return (
    <motion.header
      className={`sticky top-0 z-50 transition-all duration-300 border-b ${
        isScrolled
          ? "bg-card/90 backdrop-blur-xl shadow-sm py-2"
          : "bg-card py-3"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Left: Mascot + Logo + Name + Table */}
          <div className="flex items-center gap-3 min-w-0">
            {animEnabled && branding?.mascot && branding.mascot !== "none" && (
              <MascotIcon mascot={branding.mascot} size={isScrolled ? 28 : 34} primaryColor={primaryColor} customImageUrl={branding?.mascot_image_url} />
            )}
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={restaurantName}
                className={`rounded-full object-cover border-2 border-primary/20 transition-all ${
                  isScrolled ? "w-8 h-8" : "w-10 h-10"
                }`}
              />
            ) : (
              <div
                className={`rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary transition-all ${
                  isScrolled ? "w-8 h-8 text-sm" : "w-10 h-10 text-base"
                }`}
              >
                {restaurantName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              {animEnabled ? (
                <AnimatedHotelName
                  name={restaurantName}
                  animation={branding?.letter_animation || "bounce"}
                  speed={branding?.animation_speed || "normal"}
                  primaryColor={branding?.glow_color_sync ? primaryColor : undefined}
                  className={`font-bold transition-all ${isScrolled ? "text-sm" : "text-base"}`}
                />
              ) : (
              <h1
                className={`font-bold truncate transition-all ${
                  isScrolled ? "text-sm" : "text-base"
                }`}
              >
                {restaurantName}
              </h1>
              )}
              {tableNumber && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-4 font-medium"
                >
                  Table {tableNumber}
                </Badge>
              )}
            </div>
          </div>

          {/* Right: Bell + Cart */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full h-9 w-9"
              onClick={onCallWaiter}
              disabled={isCallingWaiter}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-warning" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full h-9 w-9"
              onClick={onCartClick}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1"
                >
                  {cartCount > 9 ? "9+" : cartCount}
                </motion.span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
