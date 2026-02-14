import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Upload, Trash2, Save, Loader2, MapPin, Palette, ImageIcon, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Restaurant = Tables<"restaurants">;
type SubscriptionTier = "free" | "pro" | "enterprise";

interface EditHotelProfileProps {
  restaurant: Restaurant;
  onSave: (updates: Partial<Restaurant>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onBack: () => void;
  isSaving?: boolean;
}

function BrandingUploadField({ label, value, tenantId, field, onChange }: {
  label: string; value: string; tenantId: string; field: string; onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Too large', description: 'Max 2MB.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `tenants/${tenantId}/${field}.${ext}`;
      const { error } = await supabase.storage.from('menu-images').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('menu-images').getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
          {value ? (
            <img src={value} alt={label} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
              Upload
            </Button>
            {value && (
              <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => onChange('')}>
                <X className="w-3 h-3 mr-1" /> Remove
              </Button>
            )}
          </div>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

export function EditHotelProfile({
  restaurant, onSave, onDelete, onBack, isSaving = false,
}: EditHotelProfileProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("business");
  const [formData, setFormData] = useState({
    name: restaurant.name || "",
    slug: restaurant.slug || "",
    email: restaurant.email || "",
    phone: restaurant.phone || "",
    address: restaurant.address || "",
    description: restaurant.description || "",
    subscription_tier: (restaurant.subscription_tier || "free") as SubscriptionTier,
    subscription_ends_at: restaurant.subscription_ends_at?.split("T")[0] || "",
    is_active: restaurant.is_active ?? true,
    ads_enabled: restaurant.ads_enabled ?? true,
    tax_rate: restaurant.tax_rate?.toString() || "5",
    service_charge_rate: restaurant.service_charge_rate?.toString() || "0",
    currency: restaurant.currency || "INR",
    primary_color: restaurant.primary_color || "#3B82F6",
    secondary_color: restaurant.secondary_color || "#10B981",
    font_family: restaurant.font_family || "Inter",
    logo_url: restaurant.logo_url || "",
    favicon_url: restaurant.favicon_url || "",
    banner_image_url: restaurant.banner_image_url || "",
    cover_image_url: restaurant.cover_image_url || "",
  });

  useEffect(() => {
    setFormData({
      name: restaurant.name || "",
      slug: restaurant.slug || "",
      email: restaurant.email || "",
      phone: restaurant.phone || "",
      address: restaurant.address || "",
      description: restaurant.description || "",
      subscription_tier: (restaurant.subscription_tier || "free") as SubscriptionTier,
      subscription_ends_at: restaurant.subscription_ends_at?.split("T")[0] || "",
      is_active: restaurant.is_active ?? true,
      ads_enabled: restaurant.ads_enabled ?? true,
      tax_rate: restaurant.tax_rate?.toString() || "5",
      service_charge_rate: restaurant.service_charge_rate?.toString() || "0",
      currency: restaurant.currency || "INR",
      primary_color: restaurant.primary_color || "#3B82F6",
      secondary_color: restaurant.secondary_color || "#10B981",
      font_family: restaurant.font_family || "Inter",
      logo_url: restaurant.logo_url || "",
      favicon_url: restaurant.favicon_url || "",
      banner_image_url: restaurant.banner_image_url || "",
      cover_image_url: restaurant.cover_image_url || "",
    });
  }, [restaurant]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast({ title: "Validation Error", description: "Name and subdomain are required.", variant: "destructive" });
      return;
    }
    try {
      await onSave({
        name: formData.name,
        slug: formData.slug.toLowerCase().replace(/\s+/g, "-"),
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        description: formData.description || null,
        subscription_tier: formData.subscription_tier,
        subscription_ends_at: formData.subscription_ends_at ? new Date(formData.subscription_ends_at).toISOString() : null,
        is_active: formData.is_active,
        ads_enabled: formData.ads_enabled,
        tax_rate: parseFloat(formData.tax_rate) || 5,
        service_charge_rate: parseFloat(formData.service_charge_rate) || 0,
        currency: formData.currency,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        font_family: formData.font_family,
        logo_url: formData.logo_url || null,
        favicon_url: formData.favicon_url || null,
        banner_image_url: formData.banner_image_url || null,
        cover_image_url: formData.cover_image_url || null,
      });
      toast({ title: "Changes Saved", description: "Hotel profile has been updated." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save changes.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      try {
        await onDelete(restaurant.id);
        toast({ title: "Hotel Deleted", description: "The hotel has been removed from the platform." });
        onBack();
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to delete hotel.", variant: "destructive" });
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <p className="text-sm text-muted-foreground">Tenants / Edit Hotel Profile</p>
            <h1 className="text-2xl font-bold">Edit Hotel Profile</h1>
          </div>
        </div>
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive border-destructive"><Trash2 className="w-4 h-4 mr-2" />Delete Hotel</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Hotel?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete {restaurant.name} and all its data.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Main Card */}
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle>Edit Hotel Profile</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {/* Logo + Basic Row */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <BrandingUploadField label="Logo" value={formData.logo_url} tenantId={restaurant.id} field="logo" onChange={(url) => handleChange("logo_url", url)} />
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Subdomain</Label><Input value={formData.slug} onChange={(e) => handleChange("slug", e.target.value)} /></div>
              <div className="space-y-2"><Label>Hotel Name</Label><Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={formData.subscription_tier} onValueChange={(v: SubscriptionTier) => handleChange("subscription_tier", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} /></div>
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Phone</Label><Input value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Plan End Date</Label>
              <Input type="date" value={formData.subscription_ends_at} onChange={(e) => handleChange("subscription_ends_at", e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Brief description..." rows={3} />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="ads">Ads</TabsTrigger>
            </TabsList>

            <TabsContent value="business" className="space-y-4 pt-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div><p className="font-medium">Active</p><p className="text-sm text-muted-foreground">Enable or disable hotel access</p></div>
                <Switch checked={formData.is_active} onCheckedChange={(v) => handleChange("is_active", v)} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Textarea value={formData.address} onChange={(e) => handleChange("address", e.target.value)} className="pl-10" rows={2} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="branding" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <BrandingUploadField label="Favicon" value={formData.favicon_url} tenantId={restaurant.id} field="favicon" onChange={(url) => handleChange("favicon_url", url)} />
                <BrandingUploadField label="Banner (1920×600)" value={formData.banner_image_url} tenantId={restaurant.id} field="banner" onChange={(url) => handleChange("banner_image_url", url)} />
                <BrandingUploadField label="Cover Image" value={formData.cover_image_url} tenantId={restaurant.id} field="cover" onChange={(url) => handleChange("cover_image_url", url)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={formData.primary_color} onChange={(e) => handleChange("primary_color", e.target.value)} className="h-10 w-14 p-1" />
                    <Input value={formData.primary_color} onChange={(e) => handleChange("primary_color", e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={formData.secondary_color} onChange={(e) => handleChange("secondary_color", e.target.value)} className="h-10 w-14 p-1" />
                    <Input value={formData.secondary_color} onChange={(e) => handleChange("secondary_color", e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Select value={formData.font_family} onValueChange={(v) => handleChange("font_family", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                      <SelectItem value="Lora">Lora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="billing" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={formData.currency} onValueChange={(v) => handleChange("currency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Tax Rate (%)</Label><Input type="number" value={formData.tax_rate} onChange={(e) => handleChange("tax_rate", e.target.value)} /></div>
                <div className="space-y-2"><Label>Service Charge (%)</Label><Input type="number" value={formData.service_charge_rate} onChange={(e) => handleChange("service_charge_rate", e.target.value)} /></div>
              </div>
            </TabsContent>

            <TabsContent value="ads" className="space-y-4 pt-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div><p className="font-medium">Enable Ads</p><p className="text-sm text-muted-foreground">Show promotional ads on customer menu</p></div>
                <Switch checked={formData.ads_enabled} onCheckedChange={(v) => handleChange("ads_enabled", v)} />
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onBack}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
