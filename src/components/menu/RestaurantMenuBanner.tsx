import { useState } from "react";
import { Star, MapPin, UtensilsCrossed, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface RestaurantMenuBannerProps {
  restaurantName: string;
  logoUrl?: string | null;
  bannerImageUrl?: string | null;
  tagline?: string | null;
  tableNumber?: string | null;
  seatNumber?: number | number[];
  rating?: number | null;
  totalReviews?: number | null;
  cuisine?: string | null;
  city?: string | null;
  primaryColor?: string | null;
}

export function RestaurantMenuBanner({
  restaurantName,
  logoUrl,
  bannerImageUrl,
  tagline,
  tableNumber,
  seatNumber,
  rating,
  totalReviews,
  cuisine,
  city,
  primaryColor,
}: RestaurantMenuBannerProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);

  const hasBanner = bannerImageUrl && !bannerFailed;
  const hasLogo = logoUrl && !logoFailed;

  const displayTagline =
    tagline && tagline.trim().length > 0
      ? tagline
      : cuisine
      ? `${cuisine} Specialty • Fresh & Made to Order`
      : "Authentic Flavors • Prepared Fresh Daily";

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden mb-3.5 border border-zinc-200/50 dark:border-zinc-800/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-zinc-900 select-none transition-all duration-300"
      style={{
        minHeight: "108px",
      }}
    >
      {/* Background Layer: Banner Image or Luxury Dark Emerald Gradient */}
      {hasBanner ? (
        <>
          <img
            src={bannerImageUrl}
            alt={restaurantName || "Restaurant Banner"}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setBannerFailed(true)}
          />
          {/* Multi-stop directional overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/80 to-zinc-950/40 dark:from-zinc-950/95 dark:via-zinc-950/85 dark:to-zinc-950/60 backdrop-blur-[1px]" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950/70">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        </div>
      )}

      {/* Decorative ambient brand accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 opacity-90 z-10"
        style={primaryColor ? { background: `linear-gradient(90deg, ${primaryColor}, #10b981)` } : undefined}
      />

      {/* Content Container */}
      <div className="relative z-10 p-3.5 sm:p-4 flex items-center gap-3.5">
        {/* Restaurant Logo Avatar */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/95 dark:bg-zinc-900/90 p-1 border border-white/20 dark:border-zinc-700/60 shadow-md backdrop-blur-md flex items-center justify-center overflow-hidden">
            {hasLogo ? (
              <img
                src={logoUrl!}
                alt={restaurantName}
                className="w-full h-full object-contain rounded-lg"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                <UtensilsCrossed className="w-6 h-6 stroke-[2]" />
              </div>
            )}
          </div>
          {/* Subtle live indicator badge on avatar */}
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 shadow-sm flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          </span>
        </div>

        {/* Restaurant Information */}
        <div className="flex-1 min-w-0">
          {/* Title Row with Live Dine-In Status */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight truncate">
              {restaurantName || "Our Restaurant"}
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Dine-In
            </span>
          </div>

          {/* Tagline / Subtitle */}
          <p className="text-xs text-zinc-300 dark:text-zinc-300/90 line-clamp-1 mt-0.5 font-medium leading-normal">
            {displayTagline}
          </p>

          {/* Branding Badges: Table, Seat, Google Rating, Location */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {tableNumber && (
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0 h-4 font-extrabold uppercase bg-white/10 text-white border-white/20 backdrop-blur-sm shrink-0"
              >
                Table {tableNumber}
              </Badge>
            )}

            {seatNumber !== undefined && (
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0 h-4 font-extrabold uppercase bg-sky-500/20 text-sky-200 border-sky-400/30 backdrop-blur-sm shrink-0"
              >
                {Array.isArray(seatNumber) && seatNumber.length > 1 ? "Seats" : "Seat"}{" "}
                {Array.isArray(seatNumber) ? [...seatNumber].sort((a, b) => a - b).join(", ") : seatNumber}
              </Badge>
            )}

            {rating !== undefined && rating !== null && totalReviews !== undefined && totalReviews > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0 h-4 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 backdrop-blur-sm shrink-0">
                <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300 shrink-0" />
                {rating.toFixed(1)}
                <span className="text-amber-200/70 font-normal">({totalReviews})</span>
              </span>
            )}

            {city && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-zinc-300/80 shrink-0">
                <MapPin className="w-2.5 h-2.5 text-zinc-400" />
                {city}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
