import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTrackAdImpression, useTrackAdClick } from '@/hooks/useAds';

interface FooterPromoAdProps {
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

export function FooterPromoAd({ ad, onDismiss }: FooterPromoAdProps) {
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-[72px] left-0 right-0 z-30 px-4 pb-2 pointer-events-none"
    >
      <div
        className="pointer-events-auto bg-primary text-primary-foreground rounded-xl p-3 flex items-center gap-3 shadow-lg cursor-pointer"
        onClick={handleClick}
      >
        {ad.image_url && (
          <img src={ad.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{ad.title}</p>
          {ad.description && <p className="text-xs opacity-80 truncate">{ad.description}</p>}
        </div>
        {(ad as any).cta_text && (
          <span className="px-3 py-1.5 bg-background text-foreground text-xs font-bold rounded-full whitespace-nowrap">
            {(ad as any).cta_text}
          </span>
        )}
      </div>
    </motion.div>
  );
}
