import React, { useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTrackAdImpression, useTrackAdClick } from '@/hooks/useAds';
import { Sparkles, ArrowRight } from 'lucide-react';
import { analyticsService } from '@/services/analyticsService';

interface Category {
  id: string;
  name: string;
}

interface Promotion {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  cta_text?: string | null;
  target_categories?: string[] | null;
  priority?: number | null;
}

interface PromotionCarouselProps {
  promotions: Promotion[];
  categories: Category[];
  onSelectCategory: (categoryName: string) => void;
  onApplyCoupon?: (couponCode: string) => void;
}

const fallbackImage = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80";

export function PromotionCarousel({
  promotions,
  categories,
  onSelectCategory,
  onApplyCoupon
}: PromotionCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    skipSnaps: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Set up pagination snaps
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const activeIndex = emblaApi.selectedScrollSnap();
    setSelectedIndex(activeIndex);

    // Track a carousel swipe event
    const activePromo = promotions[activeIndex];
    if (activePromo) {
      analyticsService.trackEvent({
        campaignId: activePromo.id,
        eventType: 'carousel_swipe',
        tenantId: (activePromo as any).restaurant_id
      });
    }
  }, [emblaApi, promotions]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Autoplay Logic (4 seconds)
  useEffect(() => {
    if (!emblaApi || promotions.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [emblaApi, promotions.length, isPaused]);

  if (!promotions || promotions.length === 0) return null;

  return (
    <div 
      className="w-full relative py-4 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Horizontal Carousel Viewport with -mx-4 px-4 for beautiful unclipped edge overflows */}
      <div className="overflow-hidden -mx-4 px-4" ref={emblaRef}>
        <div className="flex select-none gap-4">
          {promotions.map((promo, idx) => (
            <CarouselCard
              key={promo.id}
              promotion={promo}
              categories={categories}
              onSelectCategory={onSelectCategory}
              onApplyCoupon={onApplyCoupon}
              isActive={idx === selectedIndex}
            />
          ))}
        </div>
      </div>

      {/* Elegant glass side scroll buttons (visible on hover) */}
      {promotions.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-6 top-[42%] -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-950/65 dark:bg-slate-900/65 backdrop-blur-md border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-emerald-500 hover:text-slate-950 hover:border-emerald-400/30 active:scale-90"
            aria-label="Previous advertisement slide"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-6 top-[42%] -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-950/65 dark:bg-slate-900/65 backdrop-blur-md border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-emerald-500 hover:text-slate-950 hover:border-emerald-400/30 active:scale-90"
            aria-label="Next advertisement slide"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </>
      )}

      {/* Modern Active Pagination Dots */}
      {promotions.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full p-1"
              aria-label={`Go to slide ${index + 1}`}
            >
              <motion.div
                animate={{
                  width: index === selectedIndex ? 20 : 6,
                  height: 6,
                  backgroundColor: index === selectedIndex ? 'rgb(52, 211, 153)' : 'rgba(156, 163, 175, 0.3)'
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="rounded-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface CarouselCardProps {
  promotion: Promotion;
  categories: Category[];
  onSelectCategory: (categoryName: string) => void;
  onApplyCoupon?: (couponCode: string) => void;
  isActive: boolean;
}

function CarouselCard({
  promotion,
  categories,
  onSelectCategory,
  onApplyCoupon,
  isActive
}: CarouselCardProps) {
  const trackImpression = useTrackAdImpression();
  const trackClick = useTrackAdClick();
  const [imageSrc, setImageSrc] = useState<string>(promotion.image_url || fallbackImage);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Track analytics impressions
  useEffect(() => {
    if (promotion.id) {
      trackImpression.mutate(promotion.id);
    }
  }, [promotion.id]);

  useEffect(() => {
    setImageSrc(promotion.image_url || fallbackImage);
    setIsImageLoaded(false);
  }, [promotion.image_url]);

  // Click Deep Linking Actions
  const handleCardClick = () => {
    trackClick.mutate(promotion.id);
    console.log(`[Analytics] Carousel Ad Clicked - ID: ${promotion.id}, Title: ${promotion.title}`);

    const link = promotion.link_url;
    if (link) {
      try {
        const url = new URL(link);
        const params = new URLSearchParams(url.search);

        // 1. Coupon auto-apply
        const coupon = params.get('coupon') || params.get('code');
        if (coupon && onApplyCoupon) {
          onApplyCoupon(coupon);
        }

        // 2. Scroll to menu item
        const menuItemId = params.get('menu_item_id') || params.get('item');
        if (menuItemId) {
          const element = document.getElementById(`item-${menuItemId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
        }

        // 3. Category deep link
        const targetCategory = params.get('category');
        if (targetCategory) {
          onSelectCategory(targetCategory);
          return;
        }
      } catch (e) {
        console.warn("[Deep Link] Parsing error, executing fallback redirect:", link);
      }
    }

    // 4. Metadata category target fallback
    if (promotion.target_categories && promotion.target_categories.length > 0) {
      const matched = categories.find(c => 
        promotion.target_categories!.includes(c.id) || 
        promotion.target_categories!.includes(c.name)
      );
      if (matched) {
        onSelectCategory(matched.name);
        return;
      }
    }

    // 5. External Link routing
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  // Derive the promotion badge text (e.g. Swiggy style discounts)
  const discountBadgeText = React.useMemo(() => {
    if (promotion.title.toLowerCase().includes('off') || promotion.title.toLowerCase().includes('%')) {
      const match = promotion.title.match(/\d+%/);
      return match ? `${match[0]} OFF` : 'DEAL';
    }
    if (promotion.description?.toLowerCase().includes('%')) {
      const match = promotion.description.match(/\d+%/);
      return match ? `${match[0]} OFF` : 'DEAL';
    }
    return 'SPECIAL';
  }, [promotion.title, promotion.description]);

  return (
    <motion.div
      animate={{ scale: isActive ? 1 : 0.97 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      onClick={handleCardClick}
      className="flex-[0_0_88%] md:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0 relative aspect-[16/9] rounded-[24px] overflow-hidden shadow-lg cursor-pointer group snap-start border border-white/10"
    >
      {/* Background Image Panel */}
      <div className="absolute inset-0 bg-neutral-900">
        <img
          src={imageSrc}
          alt={promotion.title}
          loading="lazy"
          className={`w-full h-full object-cover transition-all duration-700 ${
            isImageLoaded ? 'scale-100 opacity-90' : 'scale-105 opacity-30 blur-md'
          } group-hover:scale-105`}
          onLoad={() => setIsImageLoaded(true)}
          onError={() => {
            setImageSrc(fallbackImage);
            setIsImageLoaded(true);
          }}
        />
        {/* Cinematic Linear Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      </div>

      {/* Floating Discount Badge (Top-Left) */}
      <div className="absolute top-4 left-4 z-20">
        <Badge className="bg-[#ff5722] hover:bg-[#e64a19] text-white border-0 text-[10px] font-extrabold uppercase px-2.5 py-1 tracking-wider rounded-lg shadow-md flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-white fill-current animate-pulse" />
          {discountBadgeText}
        </Badge>
      </div>

      {/* Dynamic Ad Card Layout */}
      <div className="relative z-10 flex flex-col justify-end h-full p-5 sm:p-6 text-left space-y-2">
        <div className="space-y-0.5 max-w-[80%]">
          <h3 className="text-lg sm:text-xl font-black text-white leading-tight uppercase drop-shadow-md line-clamp-2">
            {promotion.title}
          </h3>
          {promotion.description && (
            <p className="text-[11px] sm:text-xs text-neutral-300 font-medium line-clamp-1 opacity-90">
              {promotion.description}
            </p>
          )}
        </div>

        {/* Pulse Interactive CTA Button */}
        <Button
          size="sm"
          className="mt-1 bg-white hover:bg-neutral-100 text-neutral-900 rounded-full h-8 px-4 text-[10px] font-black uppercase w-max gap-1 shadow-md transition-transform duration-200 active:scale-95 group-hover:translate-x-0.5"
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
        >
          {promotion.cta_text || 'Claim Offer'}
          <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Button>
      </div>

      {/* Glare Glassmorphism effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none" />
    </motion.div>
  );
}
