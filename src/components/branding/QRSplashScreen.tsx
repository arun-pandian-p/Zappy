import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
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

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 p-8"
          style={{ backgroundColor: 'hsl(var(--background))' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {logoUrl ? (
            <motion.img
              src={logoUrl}
              alt={restaurantName}
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
                {restaurantName.charAt(0)}
              </span>
            </motion.div>
          )}

          <AnimatedHotelName
            name={restaurantName}
            animation={animation}
            speed={speed}
            primaryColor={primaryColor}
            className="text-3xl font-bold tracking-tight"
          />

          <MascotIcon mascot={mascot} size={56} primaryColor={primaryColor} />

          <div className="w-48">
            <Progress value={progress} className="h-1.5" />
          </div>

          <p className="text-xs text-muted-foreground">Loading {restaurantName !== 'Restaurant' ? restaurantName : 'menu'}…</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
