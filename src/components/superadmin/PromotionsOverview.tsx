import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurants, useUpdateRestaurant } from '@/hooks/useRestaurant';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Search, Megaphone, Loader2, Building2, ChevronDown, ChevronUp,
  LayoutDashboard, UtensilsCrossed, ClipboardList, ChefHat, Receipt,
  Star, Users, Eye, Settings, Ticket, FileSpreadsheet, Package, QrCode, Palette, Building,
} from 'lucide-react';
import {
  TOGGLEABLE_FEATURES,
  FEATURE_LABELS,
  FEATURE_TIERS,
  type FeatureKey,
  type FeatureToggles,
} from '@/hooks/useFeatureGate';

const FEATURE_ICONS: Partial<Record<FeatureKey, React.ComponentType<{ className?: string }>>> = {
  coupons: Ticket,
  promotions: Megaphone,
  inventory: Package,
  exports: FileSpreadsheet,
  branding: Palette,
  "multi-outlet": Building,
};

const PromotionsOverview = () => {
  const { toast } = useToast();
  const { data: restaurants = [], isLoading } = useRestaurants();
  const updateRestaurant = useUpdateRestaurant();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: offerCounts = {} } = useQuery({
    queryKey: ['offers-count-by-restaurant'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('restaurant_id')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString());

      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((o) => {
        counts[o.restaurant_id] = (counts[o.restaurant_id] || 0) + 1;
      });
      return counts;
    },
  });

  const filtered = restaurants.filter((r) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleAds = async (id: string, current: boolean) => {
    try {
      await updateRestaurant.mutateAsync({ id, updates: { ads_enabled: !current } });
      toast({ title: 'Updated', description: `Ads ${!current ? 'enabled' : 'disabled'} for this restaurant.` });
    } catch {
      toast({ title: 'Error', description: 'Failed to update.', variant: 'destructive' });
    }
  };

  const handleToggleFeature = async (restaurantId: string, feature: FeatureKey, currentToggles: FeatureToggles) => {
    const currentValue = currentToggles[feature] !== false; // default true
    const newToggles = { ...currentToggles, [feature]: !currentValue };
    try {
      await updateRestaurant.mutateAsync({
        id: restaurantId,
        updates: { feature_toggles: newToggles } as any,
      });
      toast({
        title: 'Feature Updated',
        description: `${FEATURE_LABELS[feature]} ${!currentValue ? 'enabled' : 'disabled'}.`,
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to update feature toggle.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search restaurants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary" className="text-xs">
          {restaurants.length} restaurants
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => {
          const activeOffers = offerCounts[r.id] || 0;
          const hasPromos = activeOffers > 0;
          const isExpanded = expandedId === r.id;
          const featureToggles: FeatureToggles = (r as any).feature_toggles || {};

          // Count how many toggleable features are disabled
          const disabledCount = TOGGLEABLE_FEATURES.filter(f => featureToggles[f] === false).length;

          return (
            <Card key={r.id} className="overflow-hidden border">
              <CardContent className="p-4 space-y-3">
                {/* Restaurant header */}
                <div className="flex items-start gap-3">
                  {r.logo_url ? (
                    <img src={r.logo_url} alt={r.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{r.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{r.slug}</p>
                  </div>
                  <Badge
                    variant={r.subscription_tier === 'enterprise' ? 'default' : r.subscription_tier === 'pro' ? 'secondary' : 'outline'}
                    className="text-[10px] shrink-0"
                  >
                    {r.subscription_tier || 'free'}
                  </Badge>
                </div>

                {/* Ads toggle */}
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Ads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.ads_enabled ? 'default' : 'outline'} className="text-[10px]">
                      {r.ads_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <Switch
                      checked={!!r.ads_enabled}
                      onCheckedChange={() => handleToggleAds(r.id, !!r.ads_enabled)}
                      disabled={updateRestaurant.isPending}
                    />
                  </div>
                </div>

                {/* Active Offers */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active Offers</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${hasPromos ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                    <span className="font-semibold">{activeOffers}</span>
                  </div>
                </div>

                {/* Feature toggles expand/collapse */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-xs"
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                >
                  <span className="flex items-center gap-1.5">
                    Feature Controls
                    {disabledCount > 0 && (
                      <Badge variant="destructive" className="text-[9px] h-4 px-1.5">
                        {disabledCount} off
                      </Badge>
                    )}
                  </span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </Button>

                {isExpanded && (
                  <div className="space-y-1.5 pt-1 border-t">
                    {TOGGLEABLE_FEATURES.map((feature) => {
                      const Icon = FEATURE_ICONS[feature] || Settings;
                      const isEnabled = featureToggles[feature] !== false;
                      const tier = FEATURE_TIERS[feature];

                      return (
                        <div
                          key={feature}
                          className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium">{FEATURE_LABELS[feature]}</span>
                            <Badge variant="outline" className="text-[9px] h-4 px-1">
                              {tier}
                            </Badge>
                          </div>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={() => handleToggleFeature(r.id, feature, featureToggles)}
                            disabled={updateRestaurant.isPending}
                            className="scale-75"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {!r.is_active && (
                  <Badge variant="destructive" className="text-[10px] w-full justify-center">
                    Restaurant Inactive
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No restaurants found
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionsOverview;
