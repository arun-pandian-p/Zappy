import { useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Badge } from "@/components/ui/badge";
import type { Offer } from "@/hooks/useOffers";

interface OffersSliderProps {
  offers: Offer[];
  onOfferClick?: (offer: Offer) => void;
}

export function OffersSlider({ offers, onOfferClick }: OffersSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    skipSnaps: false,
  });

  // Auto-play
  useEffect(() => {
    if (!emblaApi || offers.length <= 1) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [emblaApi, offers.length]);

  if (offers.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl" ref={emblaRef}>
      <div className="flex gap-3">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0 cursor-pointer"
            onClick={() => onOfferClick?.(offer)}
          >
            <div className="relative rounded-xl overflow-hidden bg-muted aspect-[2/1]">
              {offer.image_url ? (
                <img
                  src={offer.image_url}
                  alt={offer.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-2xl">🎉</span>
                </div>
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h4 className="text-white font-semibold text-sm line-clamp-1">{offer.title}</h4>
                {offer.discount_text && (
                  <Badge className="mt-1 bg-success hover:bg-success text-success-foreground text-xs">
                    {offer.discount_text}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
