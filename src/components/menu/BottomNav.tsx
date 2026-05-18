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
    <nav 
      className="fixed bottom-4 left-4 right-4 mx-auto max-w-md z-50 bg-white/80 backdrop-blur-xl border border-white/20 rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.12)] p-2"
      style={{ minHeight: '64px' }}
    >
      <div className="w-full h-full px-2">
        <div className="flex justify-between items-center h-[52px] relative">
          {navItems.map(({ view, icon: Icon, label }) => {
            const isActive = currentView === view;
            const badgeCount = getBadgeCount(view);

            if (view === "cart") {
              return (
                <div key={view} className="relative flex justify-center items-center w-[20%]">
                  <div className="absolute -top-7 w-[56px] h-[56px] bg-white/95 backdrop-blur-md rounded-full p-1 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] border border-white/20">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.9 }}
                      animate={badgeCount > 0 ? {
                        scale: [1, 1.04, 1],
                        transition: { repeat: Infinity, repeatType: "reverse", duration: 1.5 }
                      } : {}}
                      onClick={() => onViewChange(view)}
                      className={`w-full h-full rounded-full flex flex-col items-center justify-center transition-all ${
                        isActive ? "bg-success text-white" : "bg-[#008c4a] text-white hover:bg-[#00703b]"
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-0.5" />
                      <span className="text-[8px] font-black uppercase tracking-wider leading-none">Cart</span>
                      {badgeCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 bg-white text-[#008c4a] text-[9px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 border-2 border-[#008c4a] shadow-sm"
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
                className={`relative flex flex-col items-center justify-center w-[20%] h-full transition-all duration-200 ${
                  isActive
                    ? "text-[#008c4a]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="relative flex flex-col items-center py-1">
                  <motion.div
                    animate={isActive ? { scale: [1, 1.15, 1], y: -2 } : { scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 15 }}
                  >
                    <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                  </motion.div>
                  
                  {/* Badge */}
                  {badgeCount > 0 && view !== "cart" && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-2 bg-destructive text-white text-[9px] font-black min-w-[14px] h-[14px] rounded-full flex items-center justify-center px-1"
                    >
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </motion.span>
                  )}

                  {/* Active order dot on Orders tab */}
                  {view === "orders" && orderCount > 0 && !isActive && (
                    <span className="absolute -top-1 right-0 w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                  )}
                  
                  <span className={`text-[9px] font-bold tracking-tight ${isActive ? "text-[#008c4a]" : ""}`}>
                    {label}
                  </span>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-1.5 w-4 h-1 rounded-full bg-[#008c4a]"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
