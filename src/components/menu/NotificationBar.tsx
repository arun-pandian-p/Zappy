import { motion } from "framer-motion";
import { CheckCircle2, Clock, Bell, Sparkles, X, ArrowRight } from "lucide-react";
import { NotificationType } from "@/services/notificationService";

interface NotificationBarProps {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  onDismiss: () => void;
  onActionClick: () => void;
}

export function NotificationBar({
  title,
  message,
  type,
  onDismiss,
  onActionClick,
}: NotificationBarProps) {
  // Config per notification type
  const typeConfig = {
    received: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      bgColor: "bg-emerald-50/90 dark:bg-emerald-950/35",
      borderColor: "border-emerald-200/50 dark:border-emerald-800/20",
    },
    preparing: {
      icon: <Clock className="w-5 h-5 text-amber-500 animate-pulse" />,
      bgColor: "bg-amber-50/90 dark:bg-amber-950/35",
      borderColor: "border-amber-200/50 dark:border-amber-800/20",
    },
    ready: {
      icon: <Bell className="w-5 h-5 text-blue-500 animate-bounce" />,
      bgColor: "bg-blue-50/90 dark:bg-blue-950/35",
      borderColor: "border-blue-200/50 dark:border-blue-800/20",
    },
    delivered: {
      icon: <Sparkles className="w-5 h-5 text-purple-500" />,
      bgColor: "bg-purple-50/90 dark:bg-purple-950/35",
      borderColor: "border-purple-200/50 dark:border-purple-800/20",
    },
  };

  const config = typeConfig[type] || typeConfig.received;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed top-20 left-4 right-4 z-50 max-w-md mx-auto cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform"
      onClick={onActionClick}
    >
      <div
        className={`${config.bgColor} border ${config.borderColor} rounded-2xl p-4 shadow-xl backdrop-blur-md flex gap-3.5 items-start relative overflow-hidden`}
      >
        {/* Subtle accent glow line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-20" />

        {/* Status Icon */}
        <div className="flex-shrink-0 mt-0.5 p-1.5 rounded-xl bg-background/60 shadow-sm border border-border/10">
          {config.icon}
        </div>

        {/* Content details */}
        <div className="flex-1 min-w-0 pr-6">
          <h4 className="font-bold text-zinc-950 dark:text-zinc-50 text-sm leading-snug">
            {title}
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="absolute top-3.5 right-3.5 p-1 rounded-full text-zinc-400 hover:text-zinc-500 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 active:scale-90 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
