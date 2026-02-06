import { Home, UtensilsCrossed, ShoppingCart, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";

type ViewType = "home" | "menu" | "cart" | "orders";

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-lg pb-safe">
      <div className="container mx-auto px-4">
        <div className="flex justify-around items-center py-2">
          {navItems.map(({ view, icon: Icon, label }) => {
            const isActive = currentView === view;
            const badgeCount = getBadgeCount(view);

            return (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-[60px] ${
                  isActive
                    ? "text-success"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  
                  {/* Badge */}
                  {badgeCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1"
                    >
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </motion.span>
                  )}
                </div>

                <span className={`text-xs font-medium ${isActive ? "text-success" : ""}`}>
                  {label}
                </span>

                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-2 w-1 h-1 rounded-full bg-success"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
