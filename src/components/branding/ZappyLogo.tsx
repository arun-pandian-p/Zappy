import { cn } from "@/lib/utils";
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
}: ZappyLogoProps) {
  const height = compact ? size * 0.8 : size;

  return (
    <img
      src={zappyLogo}
      alt="ZAPPY – Scan, Order, Eat, Repeat"
      height={height}
      style={{ height, width: "auto" }}
      className={cn("inline-block shrink-0", className)}
    />
  );
}
