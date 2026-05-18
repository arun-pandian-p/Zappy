import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTrackAdImpression, useTrackAdClick } from '@/hooks/useAds';
import { Sparkles, ArrowRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface PromotionBannerProps {
  promotion: {
    id: string;
    title: string;
    description?: string | null;
    image_url?: string | null;
    link_url?: string | null;
    cta_text?: string | null;
    target_categories?: string[] | null;
    priority?: number | null;
  };
  categories: Category[];
  onSelectCategory?: (categoryName: string) => void;
  onApplyCoupon?: (couponCode: string) => void;
}

const fallbackImage = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80";

export function PromotionBanner({ 
  promotion, 
  categories, 
  onSelectCategory, 
  onApplyCoupon 
}: PromotionBannerProps) {
  const trackImpression = useTrackAdImpression();
  const trackClick = useTrackAdClick();
  const [imageSrc, setImageSrc] = useState<string>(promotion.image_url || fallbackImage);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Track impression on load
  useEffect(() => {
    if (promotion.id) {
      console.log(`[Analytics] Dynamic Ad Impression Logged - ID: ${promotion.id}, Title: ${promotion.title}`);
      trackImpression.mutate(promotion.id);
    }
  }, [promotion.id]);

  // Update image source if promotion changes
  useEffect(() => {
    setImageSrc(promotion.image_url || fallbackImage);
    setIsImageLoaded(false);
  }, [promotion.image_url]);

  // Handle banner clicks safely
  const handleBannerClick = () => {
    console.log(`[Analytics] Dynamic Ad Banner Clicked - ID: ${promotion.id}, Title: ${promotion.title}`);
    
    // Log click event on Supabase
    trackClick.mutate(promotion.id);

    const link = promotion.link_url;

    // Check if the link contains a specific deep link parameter
    if (link) {
      try {
        const url = new URL(link);
        const params = new URLSearchParams(url.search);
        
        // 1. Coupon deep link handling
        const coupon = params.get('coupon') || params.get('code');
        if (coupon && onApplyCoupon) {
          console.log(`[Deep Link] Automatically applying coupon: ${coupon}`);
          onApplyCoupon(coupon);
        }

        // 2. Menu Item scroll deep link handling
        const menuItemId = params.get('menu_item_id') || params.get('item');
        if (menuItemId) {
          console.log(`[Deep Link] Scrolling to menu item: ${menuItemId}`);
          const element = document.getElementById(`item-${menuItemId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
        }

        // 3. Category Deep link targeting check
        const targetCategory = params.get('category');
        if (targetCategory && onSelectCategory) {
          onSelectCategory(targetCategory);
          return;
        }
      } catch (err) {
        console.warn("[Deep Link] Non-standard URL format, trying standard path redirects:", link);
      }
    }

    // 4. Fallback category targeting check from metadata
    if (promotion.target_categories && promotion.target_categories.length > 0 && onSelectCategory) {
      // Find matching category name from current categories list
      const matchedCat = categories.find(c => 
        promotion.target_categories!.includes(c.id) || 
        promotion.target_categories!.includes(c.name)
      );
      if (matchedCat) {
        console.log(`[Deep Link] Deep linking menu to targeted category: ${matchedCat.name}`);
        onSelectCategory(matchedCat.name);
        return;
      }
    }

    // 5. If it is an external URL redirect
    if (link) {
      console.log(`[Redirect] Safely navigating to external URL: ${link}`);
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
      className="relative w-full rounded-[24px] overflow-hidden shadow-md cursor-pointer group mb-5 border border-white/10"
      onClick={handleBannerClick}
    >
      {/* Background image container */}
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
            console.error(`[Error] Ad image failed to load for "${promotion.title}". Displaying fallback.`);
            setImageSrc(fallbackImage);
            setIsImageLoaded(true);
          }}
        />
        {/* Sleek Gradient readable overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col justify-center min-h-[160px] p-6 sm:p-8 max-w-[65%] text-left space-y-3">
        {/* Floating Badge */}
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className="bg-white/15 backdrop-blur-md text-white hover:bg-white/25 border-none text-[10px] px-2.5 py-0.5 font-bold gap-1 w-max rounded-full shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            Promo Special
          </Badge>
        </div>

        {/* Title and description */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight uppercase drop-shadow-sm line-clamp-2">
            {promotion.title}
          </h2>
          {promotion.description && (
            <p className="text-xs sm:text-sm text-neutral-300 font-medium line-clamp-2 leading-relaxed opacity-95">
              {promotion.description}
            </p>
          )}
        </div>

        {/* CTA Button */}
        <Button 
          className="mt-1 bg-white hover:bg-neutral-100 text-neutral-900 rounded-full h-9 px-5 text-xs font-extrabold w-max gap-1.5 shadow-md transition-transform duration-200 active:scale-95 group-hover:translate-x-0.5"
          onClick={(e) => {
            e.stopPropagation();
            handleBannerClick();
          }}
        >
          {promotion.cta_text || 'Claim Offer'}
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Button>
      </div>

      {/* Decorative reflection glare effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none" />
    </motion.div>
  );
}
