import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const zappyLogo = "/lovable-uploads/8a88a85f-8568-48bd-986d-68ee17e00809.png";

interface ZappyLogoProps {
  className?: string;
  size?: number;
  compact?: boolean;
  showTagline?: boolean;
  textColor?: string;
  accentColor?: string;
  animated?: boolean;
}

export function ZappyLogo({
  className,
  size = 48,
  compact = false,
  showTagline = false,
  textColor,
  animated = false,
}: ZappyLogoProps) {
  const height = compact ? size * 0.8 : size;

  const Wrapper = animated ? motion.div : "div";
  const wrapperProps = animated
    ? { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.5 } }
    : {};

  return (
    <Wrapper
      {...(wrapperProps as any)}
      className={cn("inline-flex flex-col items-center gap-2", className)}
    >
      <img
        src={zappyLogo}
        alt="ZAPPY – Scan, Order, Eat, Repeat"
        height={height}
        style={{ height, width: "auto" }}
        className="shrink-0 rounded-2xl drop-shadow-lg"
      />
      {showTagline && (
        <div className="flex flex-col items-center gap-1">
          <span
            className="text-3xl font-extrabold tracking-wider"
            style={{ color: textColor || "inherit" }}
          >
            ZAPPY
          </span>
          <span
            className="text-sm font-medium tracking-wide opacity-70"
            style={{ color: textColor || "inherit" }}
          >
            Scan, Order, Eat, Repeat
          </span>
        </div>
      )}
    </Wrapper>
  );
}
