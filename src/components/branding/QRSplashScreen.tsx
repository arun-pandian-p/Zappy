import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedHotelName, type LetterAnimation, type AnimationSpeed } from "./AnimatedHotelName";
import { MascotIcon, type MascotType } from "./MascotIcon";

interface QRSplashScreenProps {
  restaurantName: string;
  logoUrl?: string | null;
  animation?: LetterAnimation;
  speed?: AnimationSpeed;
  mascot?: MascotType;
  primaryColor?: string;
  isLoading: boolean;
}

export function QRSplashScreen({
  restaurantName,
  logoUrl,
  animation = "bounce",
  speed = "normal",
  mascot = "none",
  primaryColor,
  isLoading,
}: QRSplashScreenProps) {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);

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

  const displayName = restaurantName || 'Restaurant';
  const progressBarColor = primaryColor || undefined;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 p-8 bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {logoUrl ? (
            <motion.img
              src={logoUrl}
              alt={displayName}
              className="w-24 h-24 rounded-2xl object-cover shadow-lg border-2 border-primary/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
            />
          ) : (
            <motion.div
              className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center shadow-lg border-2 border-primary/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <span className="text-4xl font-bold text-primary">
                {displayName.charAt(0)}
              </span>
            </motion.div>
          )}

          <AnimatedHotelName
            name={displayName}
            animation={animation}
            speed={speed}
            primaryColor={primaryColor}
            className="text-3xl font-bold tracking-tight"
          />

          <MascotIcon mascot={mascot} size={56} primaryColor={primaryColor} />

          {/* Custom progress bar with primary color support */}
          <div className="w-48 h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              style={progressBarColor ? { backgroundColor: progressBarColor } : undefined}
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Loading {displayName !== 'Restaurant' ? displayName : 'menu'}…
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
