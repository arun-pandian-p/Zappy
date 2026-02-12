import { motion } from "framer-motion";
import { Clock, CheckCircle2, ChefHat, Bell, UtensilsCrossed } from "lucide-react";

const STEPS = [
  { key: "pending", label: "Placed", icon: Clock },
  { key: "confirmed", label: "Accepted", icon: CheckCircle2 },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "ready", label: "Ready", icon: Bell },
  { key: "served", label: "Served", icon: UtensilsCrossed },
] as const;

interface OrderStatusPipelineProps {
  currentStatus: string | null;
}

export function OrderStatusPipeline({ currentStatus }: OrderStatusPipelineProps) {
  const currentIdx = STEPS.findIndex((s) => s.key === currentStatus);
  const activeIdx = currentIdx === -1 ? 0 : currentIdx;

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute top-5 left-6 right-6 h-0.5 bg-muted" />

        {/* Active line */}
        <motion.div
          className="absolute top-5 left-6 h-0.5 bg-success"
          initial={{ width: 0 }}
          animate={{
            width: `calc(${(activeIdx / (STEPS.length - 1)) * 100}% - 48px)`,
          }}
          transition={{ duration: 0.5 }}
        />

        {STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isActive = idx <= activeIdx;
          const isCurrent = idx === activeIdx;

          return (
            <div
              key={step.key}
              className="relative z-10 flex flex-col items-center gap-1.5"
            >
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isActive
                    ? "bg-success border-success text-success-foreground"
                    : "bg-card border-muted text-muted-foreground"
                }`}
                animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                transition={
                  isCurrent
                    ? { duration: 1.5, repeat: Infinity }
                    : undefined
                }
              >
                <StepIcon className="w-4 h-4" />
              </motion.div>
              <span
                className={`text-[10px] font-medium text-center leading-tight ${
                  isActive ? "text-success" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
