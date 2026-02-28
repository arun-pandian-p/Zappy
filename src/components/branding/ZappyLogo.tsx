import { cn } from "@/lib/utils";

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
  accentColor,
  animated = false,
}: ZappyLogoProps) {
  const mainColor = textColor || "var(--zappy-logo-text, #2A1B68)";
  const goldColor = accentColor || "var(--zappy-logo-accent, #F4C300)";

  const vbHeight = showTagline && !compact ? 170 : 120;
  const vbWidth = 460;
  const aspectRatio = vbWidth / vbHeight;
  const width = compact ? size * aspectRatio * 0.9 : size * aspectRatio;

  // Stroke width for bold letters
  const sw = 18;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${vbWidth} ${vbHeight}`}
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
        d="M6 10 H62 L14 90 H70"
        fill="none"
        stroke={mainColor}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ===== A ===== */}
      <path
        d="M100 90 L122 10 L144 90 M108 70 H136"
        fill="none"
        stroke={mainColor}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ===== First P — MIRRORED (bowl LEFT, stem RIGHT) ===== */}
      <g>
        <path
          d="M230 90 V10 H198 C174 10 174 55 198 55 H230"
          fill="none"
          stroke={mainColor}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Eye */}
        <circle cx="200" cy="32" r="9" fill={goldColor} />
        <circle cx="202" cy="30" r="3" fill="white" opacity="0.7" />
      </g>

      {/* ===== Second P — NORMAL (bowl RIGHT, stem LEFT) ===== */}
      <g>
        <path
          d="M254 90 V10 H286 C310 10 310 55 286 55 H254"
          fill="none"
          stroke={mainColor}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Eye */}
        <circle cx="284" cy="32" r="9" fill={goldColor} />
        <circle cx="286" cy="30" r="3" fill="white" opacity="0.7" />
      </g>

      {/* ===== Y ===== */}
      <path
        d="M342 10 L370 50 L398 10 M370 50 V90"
        fill="none"
        stroke={mainColor}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ===== Smile (wide arc below both P bowls) ===== */}
      <path
        d="M190 82 Q242 115 294 82"
        fill="none"
        stroke="url(#zappy-smile-grad)"
        strokeWidth="9"
        strokeLinecap="round"
        className={animated ? "zappy-smile-anim" : undefined}
      />

      {/* ===== Tagline ===== */}
      {showTagline && !compact && (
        <text
          x="230"
          y="150"
          textAnchor="middle"
          fill={mainColor}
          fontSize="17"
          fontFamily="'Poppins', 'Montserrat', system-ui, sans-serif"
          fontWeight="700"
          letterSpacing="3.5"
        >
          scan, order, eat, repeat
        </text>
      )}
    </svg>
  );
}
