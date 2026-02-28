import { cn } from "@/lib/utils";

interface ZappyLogoProps {
  className?: string;
  /** Height in pixels – width scales proportionally */
  size?: number;
  /** Compact mode for navbars */
  compact?: boolean;
  /** Show tagline */
  showTagline?: boolean;
  /** Override primary text color (CSS color value) */
  textColor?: string;
  /** Override accent color for eyes + smile */
  accentColor?: string;
  /** Enable smile draw animation on mount */
  animated?: boolean;
}

export function ZappyLogo({
  className,
  size = 48,
  compact = false,
  showTagline = false,
  textColor,
  accentColor,
  animated = false,
}: ZappyLogoProps) {
  const mainColor = textColor || "var(--zappy-logo-text, #2A1B68)";
  const goldColor = accentColor || "var(--zappy-logo-accent, #F4C300)";

  // Full logo viewBox: 520 x 160 (without tagline) or 520 x 200 (with tagline)
  const vbHeight = showTagline && !compact ? 200 : 145;
  const aspectRatio = 520 / vbHeight;
  const width = compact ? size * aspectRatio * 0.9 : size * aspectRatio;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 520 ${vbHeight}`}
      width={width}
      height={size}
      className={cn("inline-block shrink-0", className)}
      role="img"
      aria-label="ZAPPY – Scan, Order, Eat, Repeat"
    >
      <defs>
        <linearGradient id="zappy-smile-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={goldColor} />
          <stop offset="50%" stopColor="#FFB800" />
          <stop offset="100%" stopColor={goldColor} />
        </linearGradient>
        {animated && (
          <style>{`
            @keyframes zappy-smile-draw {
              from { stroke-dashoffset: 200; }
              to { stroke-dashoffset: 0; }
            }
            .zappy-smile-anim {
              stroke-dasharray: 200;
              stroke-dashoffset: 200;
              animation: zappy-smile-draw 0.8s ease-out 0.3s forwards;
            }
          `}</style>
        )}
      </defs>

      {/* ===== Z ===== */}
      <path
        d="M10 28 H72 L12 108 H78"
        fill="none"
        stroke={mainColor}
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ===== A ===== */}
      <path
        d="M108 108 L133 28 L158 108 M116 82 H150"
        fill="none"
        stroke={mainColor}
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ===== First P ===== */}
      <g>
        <path
          d="M190 108 V28 H228 C252 28 252 72 228 72 H190"
          fill="none"
          stroke={mainColor}
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Eye circle inside first P */}
        <circle cx="226" cy="50" r="10" fill={goldColor} />
        <circle cx="228" cy="48" r="3" fill="white" opacity="0.7" />
      </g>

      {/* ===== Second P ===== */}
      <g>
        <path
          d="M278 108 V28 H316 C340 28 340 72 316 72 H278"
          fill="none"
          stroke={mainColor}
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Eye circle inside second P */}
        <circle cx="314" cy="50" r="10" fill={goldColor} />
        <circle cx="316" cy="48" r="3" fill="white" opacity="0.7" />
      </g>

      {/* ===== Y ===== */}
      <path
        d="M370 28 L400 68 L430 28 M400 68 V108"
        fill="none"
        stroke={mainColor}
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ===== Smile ===== */}
      <path
        d="M195 100 Q270 140 345 100"
        fill="none"
        stroke="url(#zappy-smile-grad)"
        strokeWidth="10"
        strokeLinecap="round"
        className={animated ? "zappy-smile-anim" : undefined}
      />

      {/* ===== Tagline ===== */}
      {showTagline && !compact && (
        <text
          x="260"
          y="170"
          textAnchor="middle"
          fill={mainColor}
          fontSize="22"
          fontFamily="'Poppins', 'Montserrat', system-ui, sans-serif"
          fontWeight="700"
          letterSpacing="4"
        >
          scan, order, eat, repeat
        </text>
      )}
    </svg>
  );
}
