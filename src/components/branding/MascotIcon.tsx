import { motion, useReducedMotion } from "framer-motion";

export type MascotType =
  | "lion"
  | "tiger"
  | "elephant"
  | "peacock"
  | "fish"
  | "owl"
  | "panda"
  | "horse"
  | "custom"
  | "none";

const MASCOT_EMOJI: Record<Exclude<MascotType, "none" | "custom">, string> = {
  lion: "🦁",
  tiger: "🐯",
  elephant: "🐘",
  peacock: "🦚",
  fish: "🐟",
  owl: "🦉",
  panda: "🐼",
  horse: "🐴",
};

const MASCOT_ANIMATIONS: Record<Exclude<MascotType, "none" | "custom">, any> = {
  lion: {
    scale: [1, 1.1, 1],
    filter: [
      "drop-shadow(0 0 0px gold)",
      "drop-shadow(0 0 8px gold)",
      "drop-shadow(0 0 0px gold)",
    ],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
  tiger: {
    x: [0, 4, -4, 0],
    transition: { duration: 0.6, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" },
  },
  elephant: {
    y: [0, -4, 0],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
  },
  peacock: {
    scale: [0.9, 1.05, 1],
    rotate: [0, 3, -3, 0],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
  fish: {
    x: [0, 6, 0, -6, 0],
    y: [0, -2, 0, -2, 0],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
  owl: {
    opacity: [1, 1, 0.3, 1, 1],
    transition: { duration: 3, repeat: Infinity, times: [0, 0.4, 0.45, 0.5, 1] },
  },
  panda: {
    y: [0, -5, 0],
    rotate: [0, 3, 0, -3, 0],
    transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
  },
  horse: {
    x: [0, 8, 0],
    filter: [
      "blur(0px)",
      "blur(1px)",
      "blur(0px)",
    ],
    transition: { duration: 0.4, repeat: Infinity, repeatDelay: 2.5, ease: "easeIn" },
  },
};

interface MascotIconProps {
  mascot: MascotType | string;
  size?: number;
  primaryColor?: string;
  customImageUrl?: string;
}

export function MascotIcon({ mascot, size = 40, primaryColor, customImageUrl }: MascotIconProps) {
  const prefersReducedMotion = useReducedMotion();

  if (!mascot || mascot === "none") return null;

  // Custom uploaded logo
  if (mascot === "custom" && customImageUrl) {
    return (
      <motion.img
        src={customImageUrl}
        alt="Custom mascot"
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
        animate={prefersReducedMotion ? {} : { scale: [1, 1.05, 1], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
      />
    );
  }

  const emoji = MASCOT_EMOJI[mascot as Exclude<MascotType, "none" | "custom">];
  if (!emoji) return null;

  const animProps = prefersReducedMotion
    ? {}
    : MASCOT_ANIMATIONS[mascot as Exclude<MascotType, "none" | "custom">];

  return (
    <motion.span
      className="inline-flex items-center justify-center select-none"
      style={{ fontSize: size * 0.7, width: size, height: size }}
      animate={animProps}
      aria-hidden="true"
    >
      {emoji}
    </motion.span>
  );
}
