import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Save,
  Building2,
  Printer,
  CreditCard,
  Star,
  Megaphone,
  Users,
  Loader2,
  Bluetooth,
  Usb,
  QrCode,
  UserCircle,
} from "lucide-react";
import { BrandingAnimationSettings, type BrandingConfig, defaultBrandingConfig } from "@/components/branding/BrandingAnimationSettings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageUpload } from "@/components/admin/ImageUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRestaurant, useUpdateRestaurant } from "@/hooks/useRestaurant";
import { useToast } from "@/hooks/use-toast";

interface SettingsPanelProps {
  restaurantId: string;
}

interface RestaurantSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  tax_rate: number;
  service_charge_rate: number;
  ads_enabled: boolean;
  google_review_url: string;
  printer_type: "none" | "bluetooth" | "usb";
  auto_print_kitchen: boolean;
  auto_print_billing: boolean;
  review_enabled: boolean;
  google_redirect_threshold: number;
  qr_base_url: string;
  branding: BrandingConfig;
  admin_avatar: { type: "upload" | "emoji" | "mascot"; value: string };
  admin_display_name: string;
}

const PUBLISHED_URL = "https://qr-pal-maker.lovable.app";

const defaultSettings: RestaurantSettings = {
  name: "",
  address: "",
  phone: "",
  email: "",
  currency: "INR",
  tax_rate: 5,
  service_charge_rate: 0,
  ads_enabled: true,
  google_review_url: "",
  printer_type: "none",
  auto_print_kitchen: false,
  auto_print_billing: true,
  review_enabled: true,
  google_redirect_threshold: 4,
  qr_base_url: PUBLISHED_URL,
  branding: defaultBrandingConfig,
  admin_avatar: { type: "upload" as const, value: "" },
  admin_display_name: "",
};

export function SettingsPanel({ restaurantId }: SettingsPanelProps) {
  const { toast } = useToast();
  const { data: restaurant, isLoading } = useRestaurant(restaurantId);
  const updateRestaurant = useUpdateRestaurant();

  const [settings, setSettings] = useState<RestaurantSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (restaurant) {
      const printerSettings = restaurant.printer_settings as Record<string, unknown> || {};
      const reviewSettings = restaurant.review_settings as Record<string, unknown> || {};
      const extraSettings = restaurant.settings as Record<string, unknown> || {};

      const brandingRaw = (extraSettings.branding as Record<string, unknown>) || {};
      setSettings({
        name: restaurant.name || "",
        address: restaurant.address || "",
        phone: restaurant.phone || "",
        email: restaurant.email || "",
        currency: restaurant.currency || "INR",
        tax_rate: restaurant.tax_rate || 5,
        service_charge_rate: restaurant.service_charge_rate || 0,
        ads_enabled: restaurant.ads_enabled ?? true,
        google_review_url: restaurant.google_review_url || "",
        printer_type: (printerSettings.type as "none" | "bluetooth" | "usb") || "none",
        auto_print_kitchen: (printerSettings.auto_print_kitchen as boolean) ?? false,
        auto_print_billing: (printerSettings.auto_print_billing as boolean) ?? true,
        review_enabled: (reviewSettings.enabled as boolean) ?? true,
        google_redirect_threshold: (reviewSettings.google_redirect_threshold as number) || 4,
        qr_base_url: (extraSettings.qr_base_url as string) || PUBLISHED_URL,
        branding: {
          animation_enabled: (brandingRaw.animation_enabled as boolean) ?? false,
          letter_animation: (brandingRaw.letter_animation as BrandingConfig["letter_animation"]) || "bounce",
          mascot: (brandingRaw.mascot as BrandingConfig["mascot"]) || "none",
          animation_speed: (brandingRaw.animation_speed as BrandingConfig["animation_speed"]) || "normal",
          glow_color_sync: (brandingRaw.glow_color_sync as boolean) ?? true,
        },
        admin_avatar: (extraSettings.admin_avatar as any) || { type: "upload", value: "" },
        admin_display_name: (extraSettings.admin_display_name as string) || "",
      });
    }
  }, [restaurant]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await updateRestaurant.mutateAsync({
        id: restaurantId,
        updates: {
          name: settings.name,
          address: settings.address,
          phone: settings.phone,
          email: settings.email,
          currency: settings.currency,
          tax_rate: settings.tax_rate,
          service_charge_rate: settings.service_charge_rate,
          ads_enabled: settings.ads_enabled,
          google_review_url: settings.google_review_url,
          printer_settings: {
            type: settings.printer_type,
            auto_print_kitchen: settings.auto_print_kitchen,
            auto_print_billing: settings.auto_print_billing,
          },
          review_settings: {
            enabled: settings.review_enabled,
            google_redirect_threshold: settings.google_redirect_threshold,
            google_review_url: settings.google_review_url,
          },
          settings: {
            qr_base_url: settings.qr_base_url,
            branding: { ...settings.branding },
            admin_avatar: settings.admin_avatar,
            admin_display_name: settings.admin_display_name,
          } as any,
        },
      });

      toast({ title: "Settings saved successfully" });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Restaurant Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Restaurant Information
            </CardTitle>
            <CardDescription>Basic details about your restaurant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Restaurant Name</Label>
              <Input
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                placeholder="Restaurant name"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="Full address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="+91 9999999999"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  placeholder="info@restaurant.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Billing & Tax */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Billing & Tax
            </CardTitle>
            <CardDescription>Configure payment and tax settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={settings.currency}
                  onValueChange={(v) => setSettings({ ...settings, currency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">₹ INR</SelectItem>
                    <SelectItem value="USD">$ USD</SelectItem>
                    <SelectItem value="EUR">€ EUR</SelectItem>
                    <SelectItem value="GBP">£ GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tax Rate (%)</Label>
                <Input
                  type="number"
                  value={settings.tax_rate}
                  onChange={(e) =>
                    setSettings({ ...settings, tax_rate: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Service Charge (%)</Label>
                <Input
                  type="number"
                  value={settings.service_charge_rate}
                  onChange={(e) =>
                    setSettings({ ...settings, service_charge_rate: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Printer Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Printer Settings
            </CardTitle>
            <CardDescription>Configure thermal printer connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Connection Type</Label>
              <Select
                value={settings.printer_type}
                onValueChange={(v) =>
                  setSettings({ ...settings, printer_type: v as "none" | "bluetooth" | "usb" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="flex items-center gap-2">No Printer</span>
                  </SelectItem>
                  <SelectItem value="bluetooth">
                    <span className="flex items-center gap-2">
                      <Bluetooth className="w-4 h-4 text-blue-500" />
                      Bluetooth
                    </span>
                  </SelectItem>
                  <SelectItem value="usb">
                    <span className="flex items-center gap-2">
                      <Usb className="w-4 h-4 text-green-500" />
                      USB
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-print Kitchen Orders</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically print new orders to kitchen
                </p>
              </div>
              <Switch
                checked={settings.auto_print_kitchen}
                onCheckedChange={(v) => setSettings({ ...settings, auto_print_kitchen: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-print Billing Receipts</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically print receipts after payment
                </p>
              </div>
              <Switch
                checked={settings.auto_print_billing}
                onCheckedChange={(v) => setSettings({ ...settings, auto_print_billing: v })}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reviews & Feedback */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Reviews & Feedback
            </CardTitle>
            <CardDescription>Configure customer review settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Customer Reviews</Label>
                <p className="text-sm text-muted-foreground">
                  Show review prompt after order completion
                </p>
              </div>
              <Switch
                checked={settings.review_enabled}
                onCheckedChange={(v) => setSettings({ ...settings, review_enabled: v })}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Google Review URL</Label>
              <Input
                value={settings.google_review_url}
                onChange={(e) =>
                  setSettings({ ...settings, google_review_url: e.target.value })
                }
                placeholder="https://g.page/your-restaurant/review"
              />
              <p className="text-xs text-muted-foreground">
                Customers with high ratings will be redirected here
              </p>
            </div>
            <div className="space-y-2">
              <Label>Google Redirect Threshold</Label>
              <Select
                value={settings.google_redirect_threshold.toString()}
                onValueChange={(v) =>
                  setSettings({ ...settings, google_redirect_threshold: parseInt(v) })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3+ stars</SelectItem>
                  <SelectItem value="4">4+ stars</SelectItem>
                  <SelectItem value="5">5 stars only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Ratings at or above this will redirect to Google
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* QR Code Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              QR Code Settings
            </CardTitle>
            <CardDescription>Configure the base URL your QR codes point to</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>QR Base URL</Label>
              <Input
                value={settings.qr_base_url}
                onChange={(e) =>
                  setSettings({ ...settings, qr_base_url: e.target.value })
                }
                placeholder="https://yourdomain.com"
              />
              <p className="text-xs text-muted-foreground">
                The domain your QR codes will link to. Use your custom domain or the default published URL.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Branding Animations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <BrandingAnimationSettings
          config={settings.branding}
          onChange={(branding) => setSettings({ ...settings, branding })}
          restaurantName={settings.name || "Hotel Name"}
          primaryColor={restaurant?.primary_color || undefined}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              Advertising
            </CardTitle>
            <CardDescription>Configure promotional popups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Ads Popup</Label>
                <p className="text-sm text-muted-foreground">
                  Show promotional popup when customers open menu
                </p>
              </div>
              <Switch
                checked={settings.ads_enabled}
                onCheckedChange={(v) => setSettings({ ...settings, ads_enabled: v })}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile & Avatar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48 }}
      >
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="w-5 h-5" />
              Admin Profile
            </CardTitle>
            <CardDescription>Customize your admin avatar and display name</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                {settings.admin_avatar.type === "emoji" && settings.admin_avatar.value ? (
                  <AvatarFallback className="text-3xl bg-primary/10">{settings.admin_avatar.value}</AvatarFallback>
                ) : settings.admin_avatar.type === "upload" && settings.admin_avatar.value ? (
                  <AvatarImage src={settings.admin_avatar.value} />
                ) : (
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
                )}
                <AvatarFallback className="bg-primary/20 text-primary">AD</AvatarFallback>
              </Avatar>
              <div className="space-y-2 flex-1">
                <Label>Display Name</Label>
                <Input
                  value={settings.admin_display_name}
                  onChange={(e) => setSettings({ ...settings, admin_display_name: e.target.value })}
                  placeholder="Admin Name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Avatar Image</Label>
              <ImageUpload
                currentImageUrl={settings.admin_avatar.type === "upload" ? settings.admin_avatar.value : ""}
                onImageUploaded={(url) => setSettings({ ...settings, admin_avatar: { type: "upload", value: url } })}
                restaurantId={restaurantId}
                folder="avatars"
              />
            </div>
            <div className="space-y-2">
              <Label>Or pick an emoji</Label>
              <div className="flex gap-2 flex-wrap">
                {["👨‍🍳", "👩‍🍳", "🧑‍💼", "👤", "🦁", "🐯", "🎩", "⭐", "🍽️", "🔥", "💎", "🌟"].map((emoji) => (
                  <Button
                    key={emoji}
                    variant={settings.admin_avatar.type === "emoji" && settings.admin_avatar.value === emoji ? "default" : "outline"}
                    size="icon"
                    className="text-lg h-10 w-10"
                    onClick={() => setSettings({ ...settings, admin_avatar: { type: "emoji", value: emoji } })}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-end"
      >
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save All Settings
        </Button>
      </motion.div>
    </div>
  );
}

export default SettingsPanel;
