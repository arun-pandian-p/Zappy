import { useState, useEffect, useMemo } from "react";
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
  Lock,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Wifi,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Palette,
  Image as ImageLucide,
} from "lucide-react";
import { BrandingAnimationSettings, type BrandingConfig, defaultBrandingConfig } from "@/components/branding/BrandingAnimationSettings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ImageCropDialog } from "@/components/admin/ImageCropDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRestaurant, useUpdateRestaurant } from "@/hooks/useRestaurant";
import { useToast } from "@/hooks/use-toast";
import { usePrinter } from "@/hooks/usePrinter";

interface SettingsPanelProps {
  restaurantId: string;
}

const THEME_PRESETS = [
  { id: 'classic', name: 'Classic', primary: '#F97316', secondary: '#FDE68A', font: 'Inter', desc: 'Warm & inviting with orange accents', emoji: '🍽️' },
  { id: 'dark', name: 'Dark', primary: '#A78BFA', secondary: '#6366F1', font: 'Inter', desc: 'Modern dark theme with violet tones', emoji: '🌙' },
  { id: 'premium', name: 'Premium', primary: '#D4A574', secondary: '#1A1A2E', font: 'Playfair Display', desc: 'Luxurious gold & dark palette', emoji: '✨' },
  { id: 'minimal', name: 'Minimal', primary: '#374151', secondary: '#E5E7EB', font: 'Inter', desc: 'Clean white with subtle accents', emoji: '◻️' },
  { id: 'custom', name: 'Custom', primary: '#3B82F6', secondary: '#10B981', font: 'Inter', desc: 'Choose your own colors & fonts', emoji: '🎨' },
];

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
  printer_type: "none" | "bluetooth" | "usb" | "wifi";
  printer_ip: string;
  auto_print_kitchen: boolean;
  auto_print_billing: boolean;
  review_enabled: boolean;
  google_redirect_threshold: number;
  qr_base_url: string;
  branding: BrandingConfig;
  admin_avatar: { type: "upload" | "emoji" | "mascot"; value: string };
  admin_display_name: string;
  theme_preset: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  logo_url: string;
  banner_image_url: string;
  favicon_url: string;
  menu_title: string;
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
  printer_ip: "",
  auto_print_kitchen: false,
  auto_print_billing: true,
  review_enabled: true,
  google_redirect_threshold: 4,
  qr_base_url: PUBLISHED_URL,
  branding: defaultBrandingConfig,
  admin_avatar: { type: "upload" as const, value: "" },
  admin_display_name: "",
  theme_preset: "classic",
  primary_color: "#F97316",
  secondary_color: "#FDE68A",
  font_family: "Inter",
  logo_url: "",
  banner_image_url: "",
  favicon_url: "",
  menu_title: "",
};

export function SettingsPanel({ restaurantId }: SettingsPanelProps) {
  const { toast } = useToast();
  const { data: restaurant, isLoading } = useRestaurant(restaurantId);
  const updateRestaurant = useUpdateRestaurant();

  const [settings, setSettings] = useState<RestaurantSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  const printer = usePrinter(restaurantId);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      if (settings.printer_type === "bluetooth") {
        const success = await printer.connectBluetooth();
        toast({
          title: success ? "Bluetooth Connected" : "Connection Failed",
          description: success
            ? `Connected to ${printer.deviceName || "printer"}`
            : "Could not connect to Bluetooth printer. Make sure it's turned on and nearby.",
          variant: success ? "default" : "destructive",
        });
      } else if (settings.printer_type === "usb") {
        const success = await printer.connectUSB();
        toast({
          title: success ? "USB Connected" : "Connection Failed",
          description: success
            ? `Connected to ${printer.deviceName || "printer"}`
            : "Could not connect to USB printer. Make sure it's plugged in.",
          variant: success ? "default" : "destructive",
        });
      } else if (settings.printer_type === "wifi") {
        if (!settings.printer_ip) {
          toast({ title: "IP Required", description: "Enter the printer IP address first.", variant: "destructive" });
        } else {
          toast({
            title: "WiFi Printer Configured",
            description: `Printer IP set to ${settings.printer_ip}. Print test will be sent on next order.`,
          });
        }
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

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
        printer_type: (printerSettings.type as "none" | "bluetooth" | "usb" | "wifi") || "none",
        printer_ip: (printerSettings.ip as string) || "",
        auto_print_kitchen: (printerSettings.auto_print_kitchen as boolean) ?? false,
        auto_print_billing: (printerSettings.auto_print_billing as boolean) ?? true,
        review_enabled: (reviewSettings.enabled as boolean) ?? true,
        google_redirect_threshold: (reviewSettings.google_redirect_threshold as number) || 4,
        qr_base_url: (extraSettings.qr_base_url as string) || PUBLISHED_URL,
        branding: {
          animation_enabled: (brandingRaw.animation_enabled as boolean) ?? false,
          letter_animation: (brandingRaw.letter_animation as BrandingConfig["letter_animation"]) || "bounce",
          mascot: (brandingRaw.mascot as BrandingConfig["mascot"]) || "none",
          mascot_image_url: (brandingRaw.mascot_image_url as string) || "",
          animation_speed: (brandingRaw.animation_speed as BrandingConfig["animation_speed"]) || "normal",
          glow_color_sync: (brandingRaw.glow_color_sync as boolean) ?? true,
        },
        admin_avatar: (extraSettings.admin_avatar as any) || { type: "upload", value: "" },
        admin_display_name: (extraSettings.admin_display_name as string) || "",
        theme_preset: (restaurant.theme_config as any)?.preset || "classic",
        primary_color: restaurant.primary_color || "#F97316",
        secondary_color: restaurant.secondary_color || "#FDE68A",
        font_family: restaurant.font_family || "Inter",
        logo_url: restaurant.logo_url || "",
        banner_image_url: restaurant.banner_image_url || "",
        favicon_url: restaurant.favicon_url || "",
        menu_title: restaurant.menu_title || "",
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
            ip: settings.printer_ip,
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
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
          font_family: settings.font_family,
          logo_url: settings.logo_url || null,
          banner_image_url: settings.banner_image_url || null,
          favicon_url: settings.favicon_url || null,
          menu_title: settings.menu_title || null,
          theme_config: {
            preset: settings.theme_preset,
            custom_primary: settings.theme_preset === 'custom' ? settings.primary_color : null,
            custom_secondary: settings.theme_preset === 'custom' ? settings.secondary_color : null,
            custom_font: settings.theme_preset === 'custom' ? settings.font_family : null,
          },
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
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Restaurant Name
              </Label>
              <Input
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                placeholder="Restaurant name"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Address
              </Label>
              <Textarea
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="Full address"
              />
              {settings.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  View on Google Maps
                </a>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Mobile Number
                </Label>
                <Input
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="+91 9999999999"
                  type="tel"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email
                </Label>
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

      {/* Theme & Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Theme & Appearance
            </CardTitle>
            <CardDescription>Colors and fonts applied across admin, kitchen, waiter, billing, and customer menu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Preset grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {THEME_PRESETS.map((preset) => {
                const isSelected = settings.theme_preset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSettings(prev => ({
                        ...prev,
                        theme_preset: preset.id,
                        ...(preset.id !== 'custom' ? {
                          primary_color: preset.primary,
                          secondary_color: preset.secondary,
                          font_family: preset.font,
                        } : {}),
                      }));
                    }}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                      isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <span className="text-2xl">{preset.emoji}</span>
                    <div className="flex gap-1.5 mt-2">
                      <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: preset.primary }} />
                      <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: preset.secondary }} />
                    </div>
                    <p className="font-semibold text-sm mt-2">{preset.name}</p>
                    <p className="text-xs text-muted-foreground">{preset.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Custom color pickers (always visible for fine-tuning) */}
            {settings.theme_preset === 'custom' && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                      className="h-10 w-16 p-1"
                    />
                    <Input
                      value={settings.primary_color}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                      className="h-10 w-16 p-1"
                    />
                    <Input
                      value={settings.secondary_color}
                      onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Font Family</Label>
                  <Select
                    value={settings.font_family}
                    onValueChange={(v) => setSettings({ ...settings, font_family: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Montserrat">Montserrat</SelectItem>
                      <SelectItem value="Lora">Lora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Live preview swatch */}
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: settings.primary_color }} />
              <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: settings.secondary_color }} />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ fontFamily: settings.font_family }}>
                  {settings.font_family} · {settings.theme_preset}
                </p>
                <p className="text-xs text-muted-foreground">Preview of selected theme</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Customer Menu Branding */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07 }}
      >
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageLucide className="w-5 h-5" />
              Customer Menu Branding
            </CardTitle>
            <CardDescription>Upload logo, banner & favicon shown on the customer-facing menu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Logo */}
            <div className="space-y-2">
              <Label>Restaurant Logo</Label>
              <p className="text-xs text-muted-foreground">Displayed in the top bar and splash screen. Square image recommended.</p>
              <ImageUpload
                currentImageUrl={settings.logo_url || null}
                onImageUploaded={(url) => setSettings({ ...settings, logo_url: url })}
                restaurantId={restaurantId}
                folder="branding"
                maxSizeMB={10}
                enableCrop
                cropShape="round"
                cropAspect={1}
              />
            </div>

            <Separator />

            {/* Banner */}
            <div className="space-y-2">
              <Label>Banner Image</Label>
              <p className="text-xs text-muted-foreground">Hero banner at the top of the customer menu. 1200×400 recommended.</p>
              <ImageUpload
                currentImageUrl={settings.banner_image_url || null}
                onImageUploaded={(url) => setSettings({ ...settings, banner_image_url: url })}
                restaurantId={restaurantId}
                folder="branding"
                maxSizeMB={10}
                enableCrop
                cropShape="rect"
                cropAspect={3}
              />
            </div>

            <Separator />

            {/* Favicon */}
            <div className="space-y-2">
              <Label>Favicon</Label>
              <p className="text-xs text-muted-foreground">Small icon shown in browser tabs. 32×32 or 64×64 PNG recommended.</p>
              <ImageUpload
                currentImageUrl={settings.favicon_url || null}
                onImageUploaded={(url) => setSettings({ ...settings, favicon_url: url })}
                restaurantId={restaurantId}
                folder="branding"
                maxSizeMB={10}
              />
            </div>

            <Separator />

            {/* Menu Title */}
            <div className="space-y-2">
              <Label>Menu Title</Label>
              <Input
                value={settings.menu_title}
                onChange={(e) => setSettings({ ...settings, menu_title: e.target.value })}
                placeholder="e.g. Our Menu, Today's Specials"
              />
              <p className="text-xs text-muted-foreground">Custom heading displayed above menu categories. Leave empty for default.</p>
            </div>

            {/* Live preview */}
            <div className="rounded-lg border overflow-hidden bg-muted/30">
              <p className="text-xs text-muted-foreground px-3 pt-2 pb-1">Preview</p>
              <div className="relative">
                {settings.banner_image_url ? (
                  <img src={settings.banner_image_url} alt="" className="w-full h-20 object-cover" />
                ) : (
                  <div className="w-full h-20 bg-muted flex items-center justify-center text-muted-foreground text-xs">No banner</div>
                )}
              </div>
              <div className="flex items-center gap-3 px-3 py-2">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-primary/20" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {settings.name?.charAt(0) || 'R'}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold">{settings.name || 'Restaurant'}</p>
                  <p className="text-[10px] text-muted-foreground">Table T1</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="w-5 h-5" />
                  Printer Settings
                </CardTitle>
                <CardDescription>Connect your thermal POS printer via Bluetooth, USB, or WiFi</CardDescription>
              </div>
              {settings.printer_type !== "none" && (
                <div className="flex items-center gap-2">
                  {printer.isConnected ? (
                    <Badge variant="outline" className="gap-1.5 border-emerald-300 text-emerald-700 bg-emerald-50">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Connected{printer.deviceName ? ` — ${printer.deviceName}` : ""}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1.5 border-destructive/30 text-destructive bg-destructive/5">
                      <XCircle className="w-3.5 h-3.5" />
                      Disconnected
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Connection Type</Label>
              <Select
                value={settings.printer_type}
                onValueChange={(v) =>
                  setSettings({ ...settings, printer_type: v as "none" | "bluetooth" | "usb" | "wifi" })
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
                      <Bluetooth className="w-4 h-4 text-primary" />
                      Bluetooth
                    </span>
                  </SelectItem>
                  <SelectItem value="usb">
                    <span className="flex items-center gap-2">
                      <Usb className="w-4 h-4 text-primary" />
                      USB
                    </span>
                  </SelectItem>
                  <SelectItem value="wifi">
                    <span className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-primary" />
                      WiFi / Network
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* WiFi IP Address field */}
            {settings.printer_type === "wifi" && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-muted-foreground" />
                  Printer IP Address
                </Label>
                <Input
                  value={settings.printer_ip}
                  onChange={(e) => setSettings({ ...settings, printer_ip: e.target.value })}
                  placeholder="192.168.1.100"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the local network IP address of your thermal printer (e.g. 192.168.1.100)
                </p>
              </div>
            )}

            {/* Test Connection Button */}
            {settings.printer_type !== "none" && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={testingConnection || printer.isConnecting}
                  className="gap-2"
                >
                  {testingConnection || printer.isConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Test Connection
                </Button>
                {printer.isConnected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => printer.disconnect()}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <XCircle className="w-4 h-4" />
                    Disconnect
                  </Button>
                )}
              </div>
            )}

            {printer.error && (
              <p className="text-sm text-destructive">{printer.error}</p>
            )}

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
        className="relative"
      >
        {restaurant?.subscription_tier !== "enterprise" && (
          <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-3">
            <Lock className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Business plan required</p>
            <Badge variant="outline" className="text-xs">Upgrade to unlock branding animations</Badge>
          </div>
        )}
        <BrandingAnimationSettings
          config={settings.branding}
          onChange={(branding) => setSettings({ ...settings, branding })}
          restaurantName={settings.name || "Hotel Name"}
          primaryColor={restaurant?.primary_color || undefined}
          restaurantId={restaurantId}
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
