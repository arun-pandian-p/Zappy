import { cn } from "@/lib/utils";

interface ZCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export function ZCard({ children, className, hover, glow, onClick }: ZCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border border-white/[0.06] bg-card/80 backdrop-blur-xl",
        "shadow-[0_4px_24px_rgba(0,0,0,0.3)]",
        hover && "hover:border-white/[0.12] hover:shadow-[0_8px_40px_rgba(0,0,0,0.35)] hover:-translate-y-0.5",
        glow && "shadow-[0_0_20px_rgba(99,102,241,0.15),0_4px_24px_rgba(0,0,0,0.3)]",
        hover && "cursor-pointer",
        "transition-all duration-200 ease-out",
        className
      )}
    >
      {children}
    </div>
  );
}
