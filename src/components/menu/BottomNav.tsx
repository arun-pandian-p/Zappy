import { Home, UtensilsCrossed, ShoppingCart, ClipboardList, User } from "lucide-react";

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
    <nav className="fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-3 right-3 mx-auto max-w-[480px] h-[72px] z-[60] bg-white/95 dark:bg-zinc-950/95 border border-zinc-200/80 dark:border-emerald-500/20 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.08),0_12px_40px_rgba(0,0,0,0.12)] p-2 backdrop-blur-2xl">
      {/* Ambient background glow behind the active items */}
      <div className="absolute inset-0 rounded-[24px] bg-gradient-to-tr from-emerald-500/5 to-transparent -z-20 pointer-events-none" />

      <div className="w-full h-full px-2">
        <div className="flex justify-between items-center h-full relative">
          {navItems.map(({ view, icon: Icon, label }) => {
            const isActive = currentView === view;
            const badgeCount = getBadgeCount(view);

            if (view === "cart") {
              return (
                <div key={view} className="relative flex justify-center items-center w-[20%] h-full">
                  <div className="absolute -top-6 w-16 h-16 bg-white dark:bg-zinc-950 rounded-full p-1.5 shadow-[0_-4px_12px_rgba(0,0,0,0.05),0_4px_12px_rgba(16,185,129,0.08)] border border-zinc-200 dark:border-emerald-500/20 z-20">
                    <button
                      onClick={() => onViewChange(view)}
                      className={`w-full h-full rounded-full flex flex-col items-center justify-center transition-colors duration-150 ${
                        isActive 
                          ? "bg-emerald-500 dark:bg-emerald-400 text-white dark:text-slate-950 shadow-sm" 
                          : "bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-500 shadow-sm"
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-0.5" />
                      <span className={`text-[8px] font-black uppercase tracking-wider leading-none ${isActive ? "text-white dark:text-slate-950" : "text-white"}`}>Cart</span>
                      {badgeCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950 shadow-sm font-mono">
                          {badgeCount > 9 ? "9+" : badgeCount}
                        </span>
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
                className="relative flex flex-col items-center justify-center flex-1 min-w-0 h-[58px] transition-colors duration-150 z-10"
              >
                <div className="relative flex flex-col items-center py-1 w-full h-full justify-center">
                  {/* Shared active tab background */}
                  {isActive && (
                    <span className="absolute inset-0 rounded-2xl bg-emerald-500/5 dark:bg-emerald-400/10 border border-emerald-500/10 dark:border-emerald-400/20 -z-10" />
                  )}

                  <div className={isActive ? "text-emerald-600 dark:text-emerald-400 scale-105" : "text-zinc-500 dark:text-zinc-400"}>
                    <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                  </div>
                  
                  {/* Badge */}
                  {badgeCount > 0 && view !== "cart" && (
                    <span className="absolute top-1 right-2 bg-destructive text-white text-[9px] font-black min-w-[14px] h-[14px] rounded-full flex items-center justify-center px-1">
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}

                  {/* Active order dot on Orders tab */}
                  {view === "orders" && orderCount > 0 && !isActive && (
                    <span className="absolute top-1 right-3 w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                  
                  <span className={`text-[9px] font-bold tracking-tight ${isActive ? "text-emerald-600 dark:text-emerald-400 font-extrabold" : "text-zinc-500 dark:text-zinc-400"}`}>
                    {label}
                  </span>
                  
                  {/* Underline laser glow indicator */}
                  {isActive && (
                    <div className="absolute -bottom-1 w-5 h-0.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
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
