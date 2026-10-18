import { useState, useEffect } from "react";
import foodLoaderGif from "@/assets/food-loader.gif";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedHotelName, type LetterAnimation, type AnimationSpeed } from "./AnimatedHotelName";
import { MascotIcon, type MascotType } from "./MascotIcon";

interface QRSplashScreenProps {
  restaurantName: string;
  logoUrl?: string | null;
  backgroundImageUrl?: string | null;
  animation?: LetterAnimation;
  speed?: AnimationSpeed;
  mascot?: MascotType;
  primaryColor?: string;
  isLoading: boolean;
}

export function QRSplashScreen({
  restaurantName,
  logoUrl,
  backgroundImageUrl,
  animation = "bounce",
  speed = "normal",
  mascot = "none",
  primaryColor,
  isLoading,
}: QRSplashScreenProps) {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);
  const [logoFailed, setLogoFailed] = useState(false);

  // Reset logo fallback when URL changes
  useEffect(() => { setLogoFailed(false); }, [logoUrl]);

  // Auto-dismiss after 3s max or when loading finishes
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => Math.min(p + 4, isLoading ? 85 : 100));
    }, 80);

    return () => clearInterval(timer);
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      const t = setTimeout(() => setShow(false), 400);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  // Max timeout
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const displayName = restaurantName || '';
  const progressBarColor = primaryColor || undefined;
  const effectiveLogo = logoUrl && !logoFailed ? logoUrl : "/restaurant-logo.svg";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 p-8 overflow-hidden select-none"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Custom Background Image with Blur / Dark Overlay */}
          {backgroundImageUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
              style={{ backgroundImage: `url(${backgroundImageUrl})` }}
            >
              <div className="absolute inset-0 bg-black/65 backdrop-blur-[3px]" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
          )}

          {/* Logo - Always uses <img> tag per request */}
          <motion.div
            className="relative z-10 w-24 h-24 rounded-2xl overflow-hidden shadow-2xl border-2 border-primary/30 bg-background/90 backdrop-blur-md flex items-center justify-center p-2"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <img
              src={effectiveLogo}
              alt={displayName || "Restaurant Logo"}
              className="w-full h-full rounded-xl object-contain"
              onError={() => setLogoFailed(true)}
            />
          </motion.div>

          {displayName && (
            <div className="relative z-10 drop-shadow-md">
              <AnimatedHotelName
                name={displayName}
                animation={animation}
                speed={speed}
                primaryColor={primaryColor}
                className={`text-3xl font-extrabold tracking-tight ${
                  backgroundImageUrl ? "text-white" : "text-foreground"
                }`}
              />
            </div>
          )}

          {mascot && mascot !== "none" ? (
            <div className="relative z-10">
              <MascotIcon mascot={mascot} size={56} primaryColor={primaryColor} />
            </div>
          ) : (
            <motion.div
              className="relative z-10 my-1"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-2xl bg-white/95 dark:bg-zinc-900/90 shadow-lg border border-border/40 p-2.5 flex items-center justify-center backdrop-blur-md">
                <img
                  src={foodLoaderGif}
                  alt="Loading menu..."
                  className="w-20 h-16 object-contain drop-shadow-sm select-none pointer-events-none"
                />
              </div>
            </motion.div>
          )}

          {/* Custom progress bar with primary color support */}
          <div className="relative z-10 w-48 h-1.5 rounded-full bg-secondary/80 overflow-hidden shadow-inner">
            <motion.div
              className="h-full rounded-full bg-primary"
              style={progressBarColor ? { backgroundColor: progressBarColor } : undefined}
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          <p className={`relative z-10 text-xs font-medium tracking-wide ${
            backgroundImageUrl ? "text-zinc-200" : "text-muted-foreground"
          }`}>
            {displayName ? `Opening ${displayName}…` : 'Opening menu…'}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
