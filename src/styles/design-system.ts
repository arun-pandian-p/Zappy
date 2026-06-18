export const z = {
  colors: {
    bg: {
      base: "#020817",
      card: "#0B1120",
      elevated: "#0F1729",
      hover: "#141D33",
    },
    border: {
      light: "rgba(99, 102, 241, 0.12)",
      medium: "rgba(99, 102, 241, 0.2)",
      glow: "rgba(99, 102, 241, 0.35)",
    },
    primary: {
      DEFAULT: "#6366F1",
      hover: "#818CF8",
      muted: "rgba(99, 102, 241, 0.1)",
      glow: "rgba(99, 102, 241, 0.25)",
    },
    text: {
      primary: "#F1F5F9",
      secondary: "#94A3B8",
      muted: "#64748B",
    },
    success: "#22C55E",
    warning: "#F59E0B",
    destructive: "#EF4444",
    info: "#3B82F6",
  },

  radius: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
  },

  shadow: {
    card: "0 4px 24px rgba(0, 0, 0, 0.3), 0 1px 4px rgba(0, 0, 0, 0.2)",
    elevated: "0 8px 40px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.2)",
    glow: "0 0 20px rgba(99, 102, 241, 0.15), 0 4px 24px rgba(0, 0, 0, 0.3)",
  },

  glass: "bg-card/80 backdrop-blur-xl border border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.3)]",

  transition: "transition-all duration-200 ease-out",

  typography: {
    h1: "text-2xl font-bold tracking-tight text-[#F1F5F9]",
    h2: "text-xl font-semibold tracking-tight text-[#F1F5F9]",
    h3: "text-lg font-semibold text-[#F1F5F9]",
    body: "text-sm text-[#94A3B8]",
    caption: "text-xs text-[#64748B]",
    label: "text-xs font-medium uppercase tracking-wider text-[#64748B]",
  },
} as const;
