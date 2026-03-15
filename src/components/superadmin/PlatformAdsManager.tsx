import { useState } from 'react';
import { Loader2, Plus, Trash2, Edit2, Eye, BarChart3, Megaphone, Image, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAds, useCreateAd, useUpdateAd, useDeleteAd } from '@/hooks/useAds';
import { CampaignForm } from './CampaignForm';
import { AdAnalyticsPanel } from './AdAnalyticsPanel';

const PLACEMENT_LABELS: Record<string, string> = {
  header_banner: 'Header Banner',
  category_divider: 'Category Divider',
  popup_offer: 'Popup Offer',
  footer_banner: 'Footer Banner',
};

const CAMPAIGN_LABELS: Record<string, string> = {
  platform_promotion: 'Platform Promo',
  brand_advertisement: 'Brand Ad',
  restaurant_promotion: 'Restaurant Promo',
  seasonal_campaign: 'Seasonal',
  festival_offer: 'Festival',
};

export function PlatformAdsManager() {
  const { toast } = useToast();
  const { data: ads = [], isLoading } = useAds();
  const createAd = useCreateAd();
  const updateAd = useUpdateAd();
  const deleteAd = useDeleteAd();

  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);

  const handleCreate = (data: any) => {
    createAd.mutate(data, {
      onSuccess: () => {
        toast({ title: 'Campaign Created' });
        setShowForm(false);
      },
      onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });
  };

  const handleUpdate = (data: any) => {
    if (!editingAd) return;
    updateAd.mutate({ id: editingAd.id, updates: data }, {
      onSuccess: () => {
        toast({ title: 'Campaign Updated' });
        setEditingAd(null);
      },
      onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this campaign?')) return;
    deleteAd.mutate(id, {
      onSuccess: () => toast({ title: 'Campaign Deleted' }),
    });
  };

  const handleToggle = (id: string, is_active: boolean) => {
    updateAd.mutate({ id, updates: { is_active } });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  if (showForm) {
    return <CampaignForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} isPending={createAd.isPending} />;
  }

  if (editingAd) {
    return <CampaignForm initialData={editingAd} onSubmit={handleUpdate} onCancel={() => setEditingAd(null)} isPending={updateAd.isPending} />;
  }

  return (
    <Tabs defaultValue="campaigns" className="space-y-6">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="campaigns"><Megaphone className="w-4 h-4 mr-2" />Campaigns</TabsTrigger>
          <TabsTrigger value="creatives"><Image className="w-4 h-4 mr-2" />Creatives</TabsTrigger>
          <TabsTrigger value="placements"><MapPin className="w-4 h-4 mr-2" />Placements</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="w-4 h-4 mr-2" />Analytics</TabsTrigger>
        </TabsList>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />New Campaign
        </Button>
      </div>

      {/* Campaigns Tab */}
      <TabsContent value="campaigns">
        <Card>
          <CardHeader>
            <CardTitle>All Campaigns</CardTitle>
            <CardDescription>Manage platform-wide ad campaigns shown across tenant menus.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Placement</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Impressions</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {ad.image_url && <img src={ad.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                        <div>
                          <p className="font-medium">{ad.title}</p>
                          <p className="text-xs text-muted-foreground">{(ad as any).advertiser_name || '-'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {CAMPAIGN_LABELS[(ad as any).campaign_type] || 'Platform'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {PLACEMENT_LABELS[(ad as any).placement_type] || 'Popup'}
                      </Badge>
                    </TableCell>
                    <TableCell>{(ad as any).priority ?? 0}</TableCell>
                    <TableCell>{(ad.impressions || 0).toLocaleString()}</TableCell>
                    <TableCell>{(ad.clicks || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Switch checked={ad.is_active ?? true} onCheckedChange={(v) => handleToggle(ad.id, v)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditingAd(ad)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(ad.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {ads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No campaigns yet. Create your first campaign to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Creatives Tab */}
      <TabsContent value="creatives">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.filter(a => a.image_url).map((ad) => (
            <Card key={ad.id} className="overflow-hidden">
              <div className="relative">
                <img src={ad.image_url!} alt={ad.title} className="w-full h-48 object-cover" />
                <Badge className="absolute top-2 right-2">{PLACEMENT_LABELS[(ad as any).placement_type] || 'Popup'}</Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold">{ad.title}</h3>
                {(ad as any).cta_text && (
                  <Badge variant="secondary" className="mt-2">{(ad as any).cta_text}</Badge>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {(ad.impressions || 0).toLocaleString()} views · {(ad.clicks || 0).toLocaleString()} clicks
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditingAd(ad)}>
                    <Edit2 className="w-3 h-3 mr-1" />Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(ad.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {ads.filter(a => a.image_url).length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No creatives uploaded yet. Create a campaign with an image to see them here.
            </div>
          )}
        </div>
      </TabsContent>

      {/* Placements Tab */}
      <TabsContent value="placements">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(PLACEMENT_LABELS).map(([key, label]) => {
            const placementAds = ads.filter(a => (a as any).placement_type === key);
            const activeCount = placementAds.filter(a => a.is_active).length;
            return (
              <Card key={key}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{label}</CardTitle>
                    <Badge variant={activeCount > 0 ? 'default' : 'secondary'}>
                      {activeCount} active
                    </Badge>
                  </div>
                  <CardDescription>
                    {key === 'header_banner' && 'Shows at the top of the customer menu above categories.'}
                    {key === 'category_divider' && 'Inserted between menu categories as a divider card.'}
                    {key === 'popup_offer' && 'Full-screen popup shown when customer first opens the menu.'}
                    {key === 'footer_banner' && 'Sticky promo strip above the bottom navigation.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {placementAds.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No ads in this placement</p>
                  ) : (
                    <div className="space-y-2">
                      {placementAds.slice(0, 3).map(ad => (
                        <div key={ad.id} className="flex items-center gap-2 text-sm p-2 rounded-lg border">
                          {ad.image_url && <img src={ad.image_url} alt="" className="w-8 h-8 rounded object-cover" />}
                          <span className="flex-1 truncate">{ad.title}</span>
                          <Switch checked={ad.is_active ?? true} onCheckedChange={(v) => handleToggle(ad.id, v)} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>

      {/* Analytics Tab */}
      <TabsContent value="analytics">
        <AdAnalyticsPanel ads={ads} />
      </TabsContent>
    </Tabs>
  );
}
