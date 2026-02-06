import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  Trash2,
  Save,
  Loader2,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
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

export function EditHotelProfile({
  restaurant,
  onSave,
  onDelete,
  onBack,
  isSaving = false,
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
    logo_url: restaurant.logo_url || "",
  });

  // Sync form data when restaurant changes
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
      logo_url: restaurant.logo_url || "",
    });
  }, [restaurant]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast({
        title: "Validation Error",
        description: "Name and subdomain are required.",
        variant: "destructive",
      });
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
        subscription_ends_at: formData.subscription_ends_at
          ? new Date(formData.subscription_ends_at).toISOString()
          : null,
        is_active: formData.is_active,
        ads_enabled: formData.ads_enabled,
        tax_rate: parseFloat(formData.tax_rate) || 5,
        service_charge_rate: parseFloat(formData.service_charge_rate) || 0,
        currency: formData.currency,
        primary_color: formData.primary_color,
        logo_url: formData.logo_url || null,
      });

      toast({
        title: "Changes Saved",
        description: "Hotel profile has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save changes.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      try {
        await onDelete(restaurant.id);
        toast({
          title: "Hotel Deleted",
          description: "The hotel has been removed from the platform.",
        });
        onBack();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete hotel.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">Tenants / Edit Hotel Profile</p>
            <h1 className="text-2xl font-bold">Edit Hotel Profile</h1>
          </div>
        </div>
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive border-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Hotel
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Hotel?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {restaurant.name} and all its data.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Main Form Card */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Edit Hotel Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo and Basic Info Row */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Logo Upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/30">
                {formData.logo_url ? (
                  <img
                    src={formData.logo_url}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Upload className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <Button variant="outline" size="sm" className="text-primary">
                <Upload className="w-4 h-4 mr-2" />
                Change
              </Button>
            </div>

            {/* Subdomain and Name */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subdomain</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => handleChange("slug", e.target.value)}
                  placeholder="palmbeach"
                />
              </div>
              <div className="space-y-2">
                <Label>Hotel Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Palm Beach Bar & Grill"
                />
              </div>
              <div className="space-y-2">
                <Label>Owner Name</Label>
                <Input placeholder="Frank Wilson" disabled />
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select
                  value={formData.subscription_tier}
                  onValueChange={(v: SubscriptionTier) =>
                    handleChange("subscription_tier", v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="contact@palmbeach.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+1 234-567-890"
              />
            </div>
          </div>

          {/* Plan Dates and Description Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Plan Start Date</Label>
              <Input
                type="date"
                value={restaurant.created_at?.split("T")[0] || ""}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>Plan End Date</Label>
              <Input
                type="date"
                value={formData.subscription_ends_at}
                onChange={(e) => handleChange("subscription_ends_at", e.target.value)}
              />
            </div>
            <div className="space-y-2 md:row-span-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Beachside bar and grill offering fresh seafood, BBQ, and tropical cocktails."
                rows={4}
              />
            </div>
          </div>

          {/* Settings Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="business">Business Settings</TabsTrigger>
              <TabsTrigger value="billing">Billing Settings</TabsTrigger>
              <TabsTrigger value="ads">Ads Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="business" className="space-y-4 pt-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Active</p>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable this hotel's access
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => handleChange("is_active", v)}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Trial Status</p>
                  <p className="text-sm text-muted-foreground">
                    Mark as trial account
                  </p>
                </div>
                <Switch disabled />
              </div>
            </TabsContent>

            <TabsContent value="billing" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(v) => handleChange("currency", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={formData.tax_rate}
                    onChange={(e) => handleChange("tax_rate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Service Charge (%)</Label>
                  <Input
                    type="number"
                    value={formData.service_charge_rate}
                    onChange={(e) => handleChange("service_charge_rate", e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ads" className="space-y-4 pt-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Enable Ads</p>
                  <p className="text-sm text-muted-foreground">
                    Show promotional ads on customer menu
                  </p>
                </div>
                <Switch
                  checked={formData.ads_enabled}
                  onCheckedChange={(v) => handleChange("ads_enabled", v)}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Address & Map Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Textarea
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="123 Beach Road, Pacific Cove, CA"
                  className="pl-10"
                  rows={3}
                />
              </div>
            </div>
            <div className="rounded-xl overflow-hidden bg-muted h-[150px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MapPin className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Map Preview</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
