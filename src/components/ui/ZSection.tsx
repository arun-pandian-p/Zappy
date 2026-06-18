import { cn } from "@/lib/utils";

interface ZSectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  action?: React.ReactNode;
}

export function ZSection({ children, title, subtitle, className, action }: ZSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-[#F1F5F9]">{title}</h3>}
            {subtitle && <p className="text-sm text-[#94A3B8]">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
