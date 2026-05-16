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
    <div className="w-full px-4 mb-4">
      <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex select-none">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="flex-[0_0_90%] min-w-0 pr-3 cursor-pointer"
              onClick={() => onOfferClick?.(offer)}
            >
              <div className="relative rounded-2xl overflow-hidden bg-[#f0f4f1] aspect-[21/9] shadow-sm border border-black/5">
                {offer.image_url ? (
                  <img
                    src={offer.image_url}
                    alt={offer.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] flex items-center justify-center">
                    <span className="text-3xl">🎁</span>
                  </div>
                )}
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
    </div>
  );
}
