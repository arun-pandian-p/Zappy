import { useState, useEffect } from "react";
import { Search, Bell, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface BrandingConfig {
  animation_enabled?: boolean;
}

interface CustomerTopBarProps {
  restaurantName: string;
  logoUrl?: string | null;
  tableNumber: string;
  seatNumber?: number | number[];
  onSearchClick: () => void;
  onAlertsClick?: () => void;
  onProfileClick?: () => void;
  primaryColor?: string;
  branding?: BrandingConfig;
  restaurantId?: string;
  tableId?: string;
  notificationCount?: number;
  avgRating?: number;
  totalReviews?: number;
}

export function CustomerTopBar({
  restaurantName,
  logoUrl,
  tableNumber,
  seatNumber,
  onSearchClick,
  onAlertsClick,
  onProfileClick,
  primaryColor,
  branding,
  restaurantId,
  tableId,
  notificationCount = 0,
  avgRating,
  totalReviews,
}: CustomerTopBarProps) {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [customerName, setCustomerName] = useState<string>("");
  const [avatarSeed, setAvatarSeed] = useState<string>("Guest");

  useEffect(() => { setLogoFailed(false); }, [logoUrl]);

  // Fetch logged-in customer details
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user;
      if (user) {
        const name =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.display_name ||
          user.email?.split("@")[0] ||
          "Guest";
        const formatted = name
          .split(/[\s._-]+/)
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        setCustomerName(formatted);
        setAvatarSeed(user.id || formatted);
      } else {
        const guestSeed = tableNumber || "Guest";
        setCustomerName("Guest");
        setAvatarSeed(guestSeed);
      }
    });
  }, [tableNumber]);

  // Sync tab title
  useEffect(() => {
    if (restaurantName) {
      document.title = `${restaurantName} | Digital Menu`;
    }
  }, [restaurantName]);

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (v) => setIsScrolled(v > 15));
    return () => unsubscribe();
  }, [scrollY]);

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`;

  return (
    <motion.header
      className={`sticky top-0 z-[40] w-full px-4 h-[52px] flex items-center justify-between border-b transition-all duration-200 select-none ${
        isScrolled
          ? "bg-white/75 dark:bg-zinc-950/75 backdrop-blur-xl border-zinc-200/50 dark:border-zinc-800/50 shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
          : "bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md border-zinc-150/40 dark:border-zinc-900/40"
      }`}
    >
      {/* Left: Logo + Restaurant Title + Table Badge */}
      <div className="flex items-center gap-2 min-w-0">
        {logoUrl && !logoFailed ? (
          <img
            src={logoUrl}
            alt=""
            className="w-8 h-8 rounded-lg object-cover border border-zinc-200/40 dark:border-zinc-800/40 shrink-0"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shrink-0"
            style={{ backgroundColor: primaryColor || '#10B981' }}
          >
            {restaurantName ? restaurantName.charAt(0).toUpperCase() : '✦'}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <h1 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50 tracking-tight leading-none truncate mb-1">
            {restaurantName}
          </h1>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="text-[8px] px-1.5 py-0 h-[14px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-400/20 leading-none shadow-[0_1px_2px_rgba(16,185,129,0.02)] shrink-0"
            >
              Table {tableNumber || 'N/A'}
            </Badge>
            {seatNumber && (
              <Badge
                variant="outline"
                className="text-[8px] px-1.5 py-0 h-[14px] font-black uppercase bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 dark:border-sky-400/20 leading-none shrink-0"
              >
                {Array.isArray(seatNumber) && seatNumber.length > 1 ? "Seats" : "Seat"} {Array.isArray(seatNumber) ? [...seatNumber].sort((a,b)=>a-b).join(', ') : seatNumber}
              </Badge>
            )}
            {avgRating !== undefined && totalReviews !== undefined && totalReviews > 0 && (
              <span className="text-[9px] font-bold text-amber-500 dark:text-amber-400 flex items-center gap-0.5 shrink-0 leading-none">
                ★ {avgRating.toFixed(1)} <span className="text-muted-foreground dark:text-zinc-500 font-normal">({totalReviews})</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Search + Notification Bell + User Avatar */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 active:scale-95 transition-transform"
          onClick={onSearchClick}
          title="Search Menu"
        >
          <Search className="w-4 h-4" />
        </Button>

        {restaurantId && (
          <Button
            variant="ghost"
            size="icon"
            className="relative w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 active:scale-95 transition-transform"
            onClick={onAlertsClick}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 border border-white dark:border-zinc-950 shadow-[0_0_4px_rgba(244,63,94,0.4)]" />
            )}
          </Button>
        )}

        <img
          src={avatarUrl}
          alt=""
          className="w-7 h-7 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 object-cover cursor-pointer hover:scale-105 active:scale-95 transition-transform shrink-0"
          onClick={onProfileClick}
          title="Profile"
        />
      </div>
    </motion.header>
  );
}
