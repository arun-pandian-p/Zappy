import { Home, UtensilsCrossed, ShoppingCart, ClipboardList, User } from "lucide-react";
import { motion } from "framer-motion";

type ViewType = "home" | "menu" | "cart" | "orders" | "profile";

interface BottomNavProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  cartCount?: number;
  orderCount?: number;
}

const navItems: { view: ViewType; icon: typeof Home; label: string }[] = [
  { view: "home", icon: Home, label: "Home" },
  { view: "menu", icon: UtensilsCrossed, label: "Menu" },
  { view: "cart", icon: ShoppingCart, label: "Cart" },
  { view: "orders", icon: ClipboardList, label: "Orders" },
  { view: "profile", icon: User, label: "Profile" },
];

export function BottomNav({
  currentView,
  onViewChange,
  cartCount = 0,
  orderCount = 0,
}: BottomNavProps) {
  const getBadgeCount = (view: ViewType) => {
    if (view === "cart") return cartCount;
    if (view === "orders") return orderCount;
    return 0;
  };

  return (
    <motion.nav 
      animate={{ y: 0, scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 25 }}
      className="fixed bottom-[max(16px,env(safe-area-inset-bottom))] left-3 right-3 mx-auto max-w-[480px] h-[74px] z-50 bg-white/95 dark:bg-zinc-950/95 border border-zinc-200/80 dark:border-emerald-500/20 rounded-[28px] shadow-[0_24px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.45)] p-2 backdrop-blur-2xl"
    >
      {/* Ambient background glow behind the active items */}
      <div className="absolute inset-0 rounded-[28px] bg-gradient-to-tr from-emerald-500/5 to-transparent -z-20 pointer-events-none" />

      <div className="w-full h-full px-2">
        <div className="flex justify-between items-center h-full relative">
          {navItems.map(({ view, icon: Icon, label }) => {
            const isActive = currentView === view;
            const badgeCount = getBadgeCount(view);

            if (view === "cart") {
              return (
                <div key={view} className="relative flex justify-center items-center w-[20%] h-full">
                  <div className="absolute -top-[28px] w-16 h-16 bg-white dark:bg-zinc-950 rounded-full p-1.5 shadow-[0_-8px_20px_rgba(0,0,0,0.06),0_-8px_20px_rgba(16,185,129,0.1)] border border-zinc-200 dark:border-emerald-500/20 z-20">
                    <motion.button
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      animate={badgeCount > 0 ? {
                        scale: [1, 1.05, 1],
                        transition: { repeat: Infinity, repeatType: "reverse", duration: 1.8 }
                      } : {}}
                      onClick={() => onViewChange(view)}
                      className={`w-full h-full rounded-full flex flex-col items-center justify-center transition-all ${
                        isActive 
                          ? "bg-emerald-500 dark:bg-emerald-400 text-white dark:text-slate-950 shadow-[0_4px_15px_rgba(52,211,153,0.4)]" 
                          : "bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-500 shadow-md"
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-0.5" />
                      <span className={`text-[8px] font-black uppercase tracking-wider leading-none ${isActive ? "text-white dark:text-slate-950" : "text-white"}`}>Cart</span>
                      {badgeCount > 0 && (
                        <motion.span
                          initial={{ scale: 0, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950 shadow-md font-mono"
                        >
                          {badgeCount > 9 ? "9+" : badgeCount}
                        </motion.span>
                      )}
                    </motion.button>
                  </div>
                </div>
              );
            }

            return (
              <motion.button
                key={view}
                whileTap={{ scale: 0.92 }}
                onClick={() => onViewChange(view)}
                className="relative flex flex-col items-center justify-center w-[20%] h-[58px] transition-all duration-200 z-10"
              >
                <div className="relative flex flex-col items-center py-1 w-full h-full justify-center">
                  {/* Shared morphing pill background */}
                  {isActive && (
                    <motion.span
                      layoutId="activeNavTabBg"
                      className="absolute inset-0 rounded-2xl bg-emerald-500/5 dark:bg-emerald-400/10 border border-emerald-500/10 dark:border-emerald-400/20 -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 26 }}
                    />
                  )}

                  <motion.div
                    animate={isActive ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 16 }}
                    className={isActive ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"}
                  >
                    <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                  </motion.div>
                  
                  {/* Badge */}
                  {badgeCount > 0 && view !== "cart" && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1 right-2 bg-destructive text-white text-[9px] font-black min-w-[14px] h-[14px] rounded-full flex items-center justify-center px-1"
                    >
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </motion.span>
                  )}

                  {/* Active order dot on Orders tab */}
                  {view === "orders" && orderCount > 0 && !isActive && (
                    <span className="absolute top-1 right-3 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                  
                  <span className={`text-[9px] font-bold tracking-tight ${isActive ? "text-emerald-600 dark:text-emerald-400 font-extrabold" : "text-zinc-500 dark:text-zinc-400"}`}>
                    {label}
                  </span>
                  
                  {/* Underline laser glow indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicatorGlow"
                      className="absolute -bottom-1.5 w-5 h-0.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                      transition={{ type: "spring", stiffness: 480, damping: 28 }}
                    />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
