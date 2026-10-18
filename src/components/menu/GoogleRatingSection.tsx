import React from "react";
import { Star, ExternalLink, MessageSquare, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicGoogleRating } from "@/hooks/useGooglePlaces";

interface GoogleRatingSectionProps {
  restaurantId?: string;
  restaurantName?: string;
  googlePlaceId?: string | null;
  googleRating?: number | null;
  googleUserRatingsTotal?: number;
  googleMapsUrl?: string | null;
  googleReviews?: any[];
  variant?: "full" | "compact" | "badge";
  className?: string;
}

export function GoogleRatingSection({
  restaurantId,
  restaurantName,
  googlePlaceId,
  googleRating,
  googleUserRatingsTotal,
  googleMapsUrl,
  googleReviews,
  variant = "full",
  className = "",
}: GoogleRatingSectionProps) {
  const shouldQuery = !!restaurantId && googleRating === undefined && googlePlaceId === undefined;
  const { data: googleData, isLoading } = usePublicGoogleRating(shouldQuery ? restaurantId : undefined);

  const placeId = googlePlaceId !== undefined ? googlePlaceId : googleData?.placeId;
  const rating = googleRating !== undefined ? googleRating : googleData?.rating;
  const userRatingsTotal = googleUserRatingsTotal !== undefined ? googleUserRatingsTotal : (googleData?.userRatingsTotal || 0);
  const mapsUrl = googleMapsUrl !== undefined ? googleMapsUrl : (googleData?.mapsUrl || (placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : null));
  const reviews = googleReviews !== undefined ? googleReviews : (googleData?.reviews || []);
  const displayName = restaurantName || googleData?.placeName || googleData?.name || "Restaurant";

  // If no connected Google Place ID, do not render (hide cleanly)
  if (!placeId && (!shouldQuery || (!isLoading && (!googleData || !googleData.placeId)))) {
    return null;
  }

  // Loading state
  if (isLoading && shouldQuery) {
    if (variant === "badge") {
      return (
        <div className={`flex items-center gap-2 py-1 ${className}`}>
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      );
    }
    return (
      <div className={`rounded-2xl border p-4 bg-muted/20 space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // If no rating is recorded yet on Google
  const hasRating = rating !== null && rating !== undefined && Number(rating) > 0;

  // COMPACT / BADGE VARIANT (e.g. for menu header bar or search view)
  if (variant === "badge" || variant === "compact") {
    if (!hasRating && variant === "badge") return null;
    return (
      <a
        href={mapsUrl || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-zinc-900/90 shadow-sm border border-border/60 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group ${className}`}
        title="View on Google Maps"
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
          alt="Google"
          className="w-3.5 h-3.5 shrink-0"
        />
        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
        <span className="font-bold text-zinc-900 dark:text-zinc-100">{hasRating ? `${Number(rating).toFixed(1)}` : "Google"}</span>
        {userRatingsTotal > 0 && (
          <span className="text-[10px] text-muted-foreground font-normal">
            ({userRatingsTotal.toLocaleString()})
          </span>
        )}
      </a>
    );
  }

  // FULL SHOWCASE VARIANT (for home tab welcome / rating section)
  return (
    <Card className={`overflow-hidden border border-border/60 bg-gradient-to-b from-card to-muted/20 shadow-sm ${className}`}>
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Header with Google Logo & Attribution */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white dark:bg-zinc-800 flex items-center justify-center shadow-xs border border-zinc-200/50 dark:border-zinc-700/50">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                alt="Google"
                className="w-4 h-4"
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Google Ratings & Reviews</p>
            </div>
          </div>

          <Badge variant="outline" className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
            <ShieldCheck className="w-3 h-3" />
            Verified Google Business
          </Badge>
        </div>

        {/* Rating and Reviews Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-base sm:text-lg text-foreground">{displayName}</h4>
            {hasRating ? (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center text-amber-500">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                  <span className="ml-1 text-xl font-black text-foreground">{Number(rating).toFixed(1)}</span>
                </div>
                <span className="text-muted-foreground text-sm font-medium">·</span>
                <span className="text-sm text-muted-foreground font-medium">
                  {userRatingsTotal.toLocaleString()} Google ratings
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">No Google reviews yet · View on Google Maps</p>
            )}
          </div>

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors py-1.5 px-3 rounded-lg bg-primary/10 hover:bg-primary/15 self-start sm:self-center"
            >
              <span>View on Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Reviews Excerpts (if permitted by policy and available) */}
        {reviews.length > 0 ? (
          <div className="space-y-3 pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Customer Review Excerpts</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reviews.slice(0, 4).map((review, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-border/40 bg-card/60 space-y-2 text-xs hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {review.profile_photo_url ? (
                        <img
                          src={review.profile_photo_url}
                          alt={review.author_name}
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[10px]">
                          {review.author_name.charAt(0)}
                        </div>
                      )}
                      <span className="font-semibold text-foreground truncate">{review.author_name}</span>
                    </div>

                    <div className="flex items-center text-amber-500 shrink-0">
                      {[...Array(5)].map((_, starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-3 h-3 ${starIdx < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                        />
                      ))}
                    </div>
                  </div>

                  {review.text ? (
                    <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                      {review.text}
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic text-[11px]">Rated {review.rating} stars on Google</p>
                  )}

                  {review.relative_time_description && (
                    <p className="text-[10px] text-muted-foreground/70">{review.relative_time_description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Required Google Attribution Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/30 text-[10px] text-muted-foreground/70">
          <span>Google ratings are synced via Google Places API and maintained independently of Ashnora feedback.</span>
          <span className="font-medium shrink-0 ml-2">Powered by Google</span>
        </div>
      </CardContent>
    </Card>
  );
}
