import { Home, Search, ClipboardList, Bell, User } from "lucide-react";
import { motion } from "framer-motion";

export type ViewType = "home" | "search" | "orders" | "notifications" | "profile";

interface BottomNavProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  orderCount?: number;
  notificationCount?: number;
  cartCount?: number;
}

const navItems: { view: ViewType; icon: typeof Home; label: string }[] = [
  { view: "home", icon: Home, label: "Home" },
  { view: "search", icon: Search, label: "Search" },
  { view: "orders", icon: ClipboardList, label: "Orders" },
  { view: "notifications", icon: Bell, label: "Alerts" },
  { view: "profile", icon: User, label: "Profile" },
];

export function BottomNav({
  currentView,
  onViewChange,
  orderCount = 0,
  notificationCount = 0,
}: BottomNavProps) {
  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-4 right-4 mx-auto max-w-[420px] h-[64px] z-50 bg-white/75 dark:bg-zinc-950/75 border border-zinc-200/40 dark:border-zinc-800/40 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.02)] p-1.5 backdrop-blur-2xl select-none"
    >
      <div className="w-full h-full px-1">
        <div className="flex justify-between items-center h-full relative">
          {navItems.map(({ view, icon: Icon, label }) => {
            const isActive = currentView === view;
            
            let badgeCount = 0;
            if (view === "orders") badgeCount = orderCount;
            if (view === "notifications") badgeCount = notificationCount;

            return (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className="relative flex flex-col items-center justify-center flex-1 min-w-0 h-full transition-transform active:scale-95 duration-100 focus:outline-none"
              >
                <div className="relative flex flex-col items-center justify-center w-full h-full py-1">
                  {/* Glassmorphic active pill background with border highlight */}
                  {isActive && (
                    <motion.span
                      layoutId="active-nav-pill"
                      className="absolute inset-x-1 inset-y-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/10 dark:border-emerald-400/20 -z-10 shadow-[0_2px_10px_rgba(16,185,129,0.05)]"
                      transition={{ type: "spring", stiffness: 420, damping: 28 }}
                    />
                  )}

                  <motion.div
                    animate={isActive ? { scale: [1, 1.15, 1], y: [0, -2, 0] } : { scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className={isActive ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"}
                  >
                    <Icon className={`w-[18px] h-[18px] mb-0.5 transition-transform duration-200 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                  </motion.div>
                  
                  {/* Glow Badge */}
                  {badgeCount > 0 && (
                    <span className="absolute top-0.5 right-2 bg-rose-500 text-white text-[8px] font-black min-w-[14px] h-[14px] rounded-full flex items-center justify-center px-1 border border-white dark:border-zinc-950 shadow-[0_0_8px_rgba(244,63,94,0.4)] font-mono animate-pulse">
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                  
                  <span className={`text-[9px] font-bold tracking-tight transition-colors duration-200 ${isActive ? "text-emerald-600 dark:text-emerald-400 font-extrabold" : "text-zinc-500 dark:text-zinc-400"}`}>
                    {label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
