import { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTrackAdImpression, useTrackAdClick } from '@/hooks/useAds';

interface CategoryDividerAdProps {
  ad: {
    id: string;
    title: string;
    description?: string | null;
    image_url?: string | null;
    link_url?: string | null;
    cta_text?: string | null;
  };
}

export function CategoryDividerAd({ ad }: CategoryDividerAdProps) {
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="my-4 cursor-pointer"
      onClick={handleClick}
    >
      <div className="bg-accent/30 rounded-xl p-3 flex items-center gap-3 border border-accent/50">
        {ad.image_url && (
          <img src={ad.image_url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{ad.title}</p>
          {ad.description && <p className="text-xs text-muted-foreground line-clamp-1">{ad.description}</p>}
        </div>
        {(ad as any).cta_text && (
          <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full whitespace-nowrap">
            {(ad as any).cta_text}
          </span>
        )}
      </div>
    </motion.div>
  );
}
