import { Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useActiveAds } from "@/hooks/useAds";

interface PlatformAdsReadOnlyProps {
  restaurantId: string;
}

export function PlatformAdsReadOnly({ restaurantId }: PlatformAdsReadOnlyProps) {
  const { data: ads = [], isLoading } = useActiveAds();
  
  // Filter ads that target this restaurant (or all restaurants)
  const relevantAds = ads.filter(ad => {
    const targets = (ad as any).target_restaurants as string[] | null;
    if (!targets || targets.length === 0) return true;
    return targets.includes(restaurantId);
  });

  if (isLoading) return null;
  if (relevantAds.length === 0) return null;

  const PLACEMENT_LABELS: Record<string, string> = {
    header_banner: 'Header Banner',
    category_divider: 'Category Divider',
    popup_offer: 'Popup',
    footer_banner: 'Footer Banner',
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Megaphone className="w-5 h-5" />
          Platform Ads
        </CardTitle>
        <p className="text-sm text-muted-foreground">Promotional ads managed by the platform appearing in your customer menu.</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {relevantAds.map(ad => (
            <div key={ad.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              {ad.image_url ? (
                <img 
                  src={ad.image_url} 
                  alt="" 
                  className="w-12 h-12 rounded-lg object-cover bg-muted" 
                  onError={(e) => {
                    e.currentTarget.onerror = null; // Prevent infinite loop
                    e.currentTarget.src = "https://placehold.co/100x100/png?text=Ad";
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{ad.title}</p>
                <p className="text-xs text-muted-foreground">{ad.description || 'No description'}</p>
              </div>
              <Badge variant="outline" className="text-xs whitespace-nowrap">
                {PLACEMENT_LABELS[(ad as any).placement_type] || 'Popup'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default PlatformAdsReadOnly;
