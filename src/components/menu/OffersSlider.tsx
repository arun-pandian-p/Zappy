import { useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Badge } from "@/components/ui/badge";
import type { Offer } from "@/hooks/useOffers";

interface OffersSliderProps {
  offers: Offer[];
  onOfferClick?: (offer: Offer) => void;
}

export function OffersSlider({ offers, onOfferClick }: OffersSliderProps) {
  // Only render offers that contain a valid background image to avoid empty/placeholder banners
  const validOffers = offers.filter((offer) => !!offer.image_url);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    skipSnaps: false,
  });

  // Auto-play
  useEffect(() => {
    if (!emblaApi || validOffers.length <= 1) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [emblaApi, validOffers.length]);

  if (validOffers.length === 0) return null;

  return (
    <div className="overflow-hidden -mx-4 mb-4 px-4" ref={emblaRef}>
      <div className="flex select-none gap-4">
        {validOffers.map((offer) => (
          <div
            key={offer.id}
            className="flex-[0_0_88%] md:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0 cursor-pointer snap-start"
            onClick={() => onOfferClick?.(offer)}
          >
            <div className="relative rounded-2xl overflow-hidden bg-[#f0f4f1] dark:bg-zinc-900 aspect-[21/9] shadow-md border border-black/5 dark:border-white/5">
              <img
                src={offer.image_url!}
                alt={offer.title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="space-y-1">
                  <h4 className="text-white font-bold text-lg leading-tight">{offer.title}</h4>
                  {offer.discount_text && (
                    <Badge className="bg-success text-white border-0 text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider">
                      {offer.discount_text}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
