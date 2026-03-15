import { useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/admin/ImageUpload';

const CAMPAIGN_TYPES = [
  { value: 'platform_promotion', label: 'Platform Promotion' },
  { value: 'brand_advertisement', label: 'Brand Advertisement' },
  { value: 'restaurant_promotion', label: 'Restaurant Promotion' },
  { value: 'seasonal_campaign', label: 'Seasonal Campaign' },
  { value: 'festival_offer', label: 'Festival Offer' },
];

const PLACEMENT_TYPES = [
  { value: 'header_banner', label: 'Menu Header Banner' },
  { value: 'category_divider', label: 'Category Divider Ad' },
  { value: 'popup_offer', label: 'Popup Offer' },
  { value: 'footer_banner', label: 'Footer Promo Banner' },
];

const CTA_OPTIONS = ['Order Now', 'Claim Offer', 'Visit Website', 'Try Combo', 'Learn More'];

const REVENUE_MODELS = [
  { value: 'cpm', label: 'CPM (Cost per 1000 views)' },
  { value: 'cpc', label: 'CPC (Cost per click)' },
  { value: 'flat_fee', label: 'Flat Campaign Fee' },
];

interface CampaignFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function CampaignForm({ initialData, onSubmit, onCancel, isPending }: CampaignFormProps) {
  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    image_url: initialData?.image_url || '',
    link_url: initialData?.link_url || '',
    is_active: initialData?.is_active ?? true,
    campaign_type: initialData?.campaign_type || 'platform_promotion',
    placement_type: initialData?.placement_type || 'popup_offer',
    cta_text: initialData?.cta_text || '',
    priority: initialData?.priority ?? 0,
    advertiser_name: initialData?.advertiser_name || '',
    budget: initialData?.budget ?? '',
    revenue_model: initialData?.revenue_model || 'cpm',
    starts_at: initialData?.starts_at ? initialData.starts_at.slice(0, 16) : '',
    ends_at: initialData?.ends_at ? initialData.ends_at.slice(0, 16) : '',
  });

  const handleSubmit = () => {
    if (!form.title) return;
    onSubmit({
      ...form,
      budget: form.budget ? Number(form.budget) : null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Campaign' : 'Create New Campaign'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Campaign Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Summer Sale 2026" />
          </div>
          <div className="space-y-2">
            <Label>Advertiser Name</Label>
            <Input value={form.advertiser_name} onChange={(e) => setForm({ ...form, advertiser_name: e.target.value })} placeholder="e.g. Coca-Cola" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Campaign description or coupon code info..." />
        </div>

        {/* Campaign & Placement Type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Campaign Type</Label>
            <Select value={form.campaign_type} onValueChange={(v) => setForm({ ...form, campaign_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CAMPAIGN_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Placement Type</Label>
            <Select value={form.placement_type} onValueChange={(v) => setForm({ ...form, placement_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLACEMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>CTA Button Text</Label>
            <Select value={form.cta_text || 'none'} onValueChange={(v) => setForm({ ...form, cta_text: v === 'none' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder="Select CTA..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No CTA</SelectItem>
                {CTA_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Media */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Ad Creative Image</Label>
            <ImageUpload
              currentImageUrl={form.image_url}
              onImageUploaded={(url) => setForm({ ...form, image_url: url })}
              restaurantId="platform"
              folder="ads"
            />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Redirect URL</Label>
              <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Priority (higher = shown first)</Label>
              <Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
        </div>

        {/* Schedule & Budget */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Budget</Label>
            <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0.00" />
          </div>
        </div>

        {/* Revenue Model & Active */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Revenue Model</Label>
            <Select value={form.revenue_model} onValueChange={(v) => setForm({ ...form, revenue_model: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REVENUE_MODELS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            <Label>Active</Label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={handleSubmit} disabled={isPending || !form.title}>
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {initialData ? 'Update Campaign' : 'Create Campaign'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
