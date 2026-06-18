import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ZButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function ZButton({
  children,
  variant = "primary",
  size = "md",
  loading,
  icon,
  className,
  disabled,
  ...props
}: ZButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium",
        "transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/50",
        "disabled:opacity-50 disabled:pointer-events-none",
        {
          "bg-[#6366F1] text-white hover:bg-[#818CF8] shadow-[0_0_20px_rgba(99,102,241,0.25)]": variant === "primary",
          "bg-white/[0.06] text-[#F1F5F9] hover:bg-white/[0.1] border border-white/[0.08]": variant === "secondary",
          "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.06]": variant === "ghost",
          "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20": variant === "danger",
        },
        {
          "h-8 px-3 text-xs": size === "sm",
          "h-10 px-4 text-sm": size === "md",
          "h-12 px-6 text-base": size === "lg",
        },
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
