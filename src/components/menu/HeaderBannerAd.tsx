import { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTrackAdImpression, useTrackAdClick } from '@/hooks/useAds';

interface HeaderBannerAdProps {
  ad: {
    id: string;
    title: string;
    description?: string | null;
    image_url?: string | null;
    link_url?: string | null;
    cta_text?: string | null;
  };
  onDismiss?: () => void;
}

export function HeaderBannerAd({ ad, onDismiss }: HeaderBannerAdProps) {
  const trackImpression = useTrackAdImpression();
  const trackClick = useTrackAdClick();

  useEffect(() => {
    trackImpression.mutate(ad.id);
  }, [ad.id]);

  const handleClick = () => {
    trackClick.mutate(ad.id);
    if (ad.link_url) window.open(ad.link_url, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-xl overflow-hidden mb-4 cursor-pointer"
      onClick={handleClick}
    >
      {ad.image_url ? (
        <div className="relative">
          <img src={ad.image_url} alt={ad.title} className="w-full h-28 object-cover rounded-xl" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent rounded-xl" />
          <div className="absolute bottom-3 left-3 right-10">
            <p className="text-white font-semibold text-sm truncate">{ad.title}</p>
            {(ad as any).cta_text && (
              <span className="inline-block mt-1 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                {(ad as any).cta_text}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-primary/10 p-4 rounded-xl">
          <p className="font-semibold text-sm">{ad.title}</p>
          {ad.description && <p className="text-xs text-muted-foreground mt-1">{ad.description}</p>}
        </div>
      )}
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 bg-black/30 hover:bg-black/50 text-white rounded-full"
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </motion.div>
  );
}
