import { motion, useReducedMotion } from "framer-motion";

export type LetterAnimation = "bounce" | "wave" | "glow" | "slide" | "typing";
export type AnimationSpeed = "slow" | "normal" | "fast";

interface AnimatedHotelNameProps {
  name: string;
  animation?: LetterAnimation;
  speed?: AnimationSpeed;
  primaryColor?: string;
  className?: string;
}

const speedMultiplier: Record<AnimationSpeed, number> = {
  slow: 1.6,
  normal: 1,
  fast: 0.5,
};

export function AnimatedHotelName({
  name,
  animation = "bounce",
  speed = "normal",
  primaryColor,
  className = "",
}: AnimatedHotelNameProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion || !animation) {
    return <span className={className}>{name}</span>;
  }

  const mult = speedMultiplier[speed];
  const letters = name.split("");

  return (
    <span className={`inline-flex flex-wrap ${className}`} aria-label={name}>
      {letters.map((letter, i) => (
        <AnimatedLetter
          key={`${letter}-${i}`}
          letter={letter}
          index={i}
          total={letters.length}
          animation={animation}
          mult={mult}
          primaryColor={primaryColor}
        />
      ))}
    </span>
  );
}

function AnimatedLetter({
  letter,
  index,
  total,
  animation,
  mult,
  primaryColor,
}: {
  letter: string;
  index: number;
  total: number;
  animation: LetterAnimation;
  mult: number;
  primaryColor?: string;
}) {
  if (letter === " ") {
    return <span className="inline-block w-[0.3em]">&nbsp;</span>;
  }

  const delay = index * 0.06 * mult;

  const variants: Record<LetterAnimation, any> = {
    bounce: {
      y: [0, -8, 0],
      transition: {
        delay,
        duration: 0.5 * mult,
        repeat: Infinity,
        repeatDelay: total * 0.06 * mult + 1.5 * mult,
        ease: "easeInOut",
      },
    },
    wave: {
      y: [0, -6, 0, 6, 0],
      transition: {
        delay,
        duration: 0.8 * mult,
        repeat: Infinity,
        repeatDelay: total * 0.06 * mult + 2 * mult,
        ease: "easeInOut",
      },
    },
    glow: {
      textShadow: [
        `0 0 0px ${primaryColor || "hsl(var(--primary))"}`,
        `0 0 12px ${primaryColor || "hsl(var(--primary))"}`,
        `0 0 0px ${primaryColor || "hsl(var(--primary))"}`,
      ],
      transition: {
        delay,
        duration: 1.2 * mult,
        repeat: Infinity,
        repeatDelay: 0.5 * mult,
        ease: "easeInOut",
      },
    },
    slide: {
      x: [index % 2 === 0 ? -20 : 20, 0],
      opacity: [0, 1],
      transition: {
        delay,
        duration: 0.4 * mult,
        ease: "easeOut",
      },
    },
    typing: {
      opacity: [0, 1],
      transition: {
        delay,
        duration: 0.05 * mult,
        ease: "linear",
      },
    },
  };

  return (
    <motion.span
      className="inline-block"
      initial={
        animation === "slide"
          ? { x: index % 2 === 0 ? -20 : 20, opacity: 0 }
          : animation === "typing"
          ? { opacity: 0 }
          : {}
      }
      animate={variants[animation]}
    >
      {letter}
    </motion.span>
  );
}
