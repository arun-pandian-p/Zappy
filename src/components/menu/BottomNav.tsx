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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t rounded-t-[20px] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe" style={{ minHeight: '70px' }}>
      <div className="container mx-auto px-2 h-full">
        <div className="flex justify-between items-center h-[70px] relative">
          {navItems.map(({ view, icon: Icon, label }) => {
            const isActive = currentView === view;
            const badgeCount = getBadgeCount(view);

            if (view === "cart") {
              return (
                <div key={view} className="relative flex justify-center items-center w-[20%]">
                  <div className="absolute -top-6 w-[60px] h-[60px] bg-white rounded-full p-1.5 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                    <button
                      onClick={() => onViewChange(view)}
                      className={`w-full h-full rounded-full flex flex-col items-center justify-center transition-all ${
                        isActive ? "bg-[#00703b] text-white" : "bg-[#008c4a] text-white hover:bg-[#00703b]"
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-0.5" />
                      <span className="text-[9px] font-medium leading-none">Cart</span>
                      {badgeCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 bg-white text-[#008c4a] text-[10px] font-bold min-w-[20px] h-[20px] rounded-full flex items-center justify-center px-1 border-2 border-[#008c4a]"
                        >
                          {badgeCount > 9 ? "9+" : badgeCount}
                        </motion.span>
                      )}
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={`relative flex flex-col items-center justify-center gap-1 w-[20%] h-full transition-all duration-200 ${
                  isActive
                    ? "text-[#008c4a]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="relative flex flex-col items-center">
                  <Icon className={`w-6 h-6 mb-1 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                  
                  {/* Badge */}
                  {badgeCount > 0 && view !== "cart" && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-2 bg-destructive text-white text-[10px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1"
                    >
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </motion.span>
                  )}

                  {/* Active order dot on Orders tab */}
                  {view === "orders" && orderCount > 0 && !isActive && (
                    <span className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-warning" />
                  )}
                  <span className={`text-[10px] font-semibold ${isActive ? "text-[#008c4a]" : ""}`}>
                    {label}
                  </span>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-2 w-5 h-1 rounded-full bg-[#008c4a]"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
