import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { forwardRef } from "react";

const zappyLogo = "/lovable-uploads/bdb8da7f-3df5-43b6-bcae-b0c1ead7f249.png";

interface ZappyLogoProps {
  className?: string;
  size?: number;
  compact?: boolean;
  showTagline?: boolean;
  textColor?: string;
  accentColor?: string;
  animated?: boolean;
  variant?: "light" | "dark";
}

export const ZappyLogo = forwardRef<HTMLDivElement, ZappyLogoProps>(({
  className,
  size = 48,
  compact = false,
  showTagline = false,
  textColor,
  animated = false,
  variant = "light"
}, ref) => {
  const isDark = variant === "dark";
  const height = compact ? size * 0.8 : size;

  const Wrapper = animated ? motion.div : "div";
  const wrapperProps = animated
    ? { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.5 } }
    : {};

  return (
    <Wrapper
      ref={ref}
      {...wrapperProps as any}
      className={cn("inline-flex flex-col items-center gap-2", className)}
    >
      <img
        src={zappyLogo}
        alt="ZAPPY"
        style={{
          height,
          width: "auto",
          objectFit: "contain",
          ...(isDark
            ? { filter: "invert(1) brightness(2)", mixBlendMode: "screen" as const }
            : {}),
        }}
        className="rounded-sm"
      />

      {showTagline && (
        <div className="flex flex-col items-center gap-1">
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
});

ZappyLogo.displayName = "ZappyLogo";
