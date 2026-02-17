import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Palette, Type, LayoutGrid, List, Sparkles, Image as ImageIcon, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

const FONT_OPTIONS = [
  "Inter", "Playfair Display", "Roboto", "Poppins", "Lato", "Montserrat",
  "Open Sans", "Raleway", "Merriweather", "Nunito",
];

const THEME_PRESETS = [
  { name: "Classic", primary: "#3B82F6", secondary: "#10B981", font: "Inter" },
  { name: "Dark Night", primary: "#8B5CF6", secondary: "#F59E0B", font: "Poppins" },
  { name: "Premium", primary: "#D4AF37", secondary: "#1A1A2E", font: "Playfair Display" },
  { name: "Minimal", primary: "#374151", secondary: "#6B7280", font: "Inter" },
  { name: "Luxury Gold", primary: "#B8860B", secondary: "#2D2D2D", font: "Playfair Display" },
  { name: "Spicy Red", primary: "#DC2626", secondary: "#F97316", font: "Montserrat" },
  { name: "Cafe Cream", primary: "#92400E", secondary: "#D97706", font: "Merriweather" },
];

interface AppearanceStudioProps {
  restaurantId: string;
  restaurant: any;
}

export function AppearanceStudio({ restaurantId, restaurant }: AppearanceStudioProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Color state
  const [primaryColor, setPrimaryColor] = useState(restaurant?.primary_color || "#3B82F6");
  const [secondaryColor, setSecondaryColor] = useState(restaurant?.secondary_color || "#10B981");

  // Typography
  const [fontFamily, setFontFamily] = useState(restaurant?.font_family || "Inter");

  // Logo URLs
  const [logoUrl, setLogoUrl] = useState(restaurant?.logo_url || "");
  const [faviconUrl, setFaviconUrl] = useState(restaurant?.favicon_url || "");
  const [bannerUrl, setBannerUrl] = useState(restaurant?.banner_image_url || "");
  const [coverUrl, setCoverUrl] = useState(restaurant?.cover_image_url || "");

  // Theme config
  const themeConfig = (restaurant?.theme_config as any) || {};
  const [buttonStyle, setButtonStyle] = useState(themeConfig.button_style || "rounded");
  const [animFadeIn, setAnimFadeIn] = useState(themeConfig.anim_fade_in ?? true);
  const [animHoverZoom, setAnimHoverZoom] = useState(themeConfig.anim_hover_zoom ?? true);

  // Menu display settings
  const menuDisplay = (restaurant?.settings as any)?.menu_display || {};
  const [viewMode, setViewMode] = useState(menuDisplay.view_mode || "grid");
  const [cardStyle, setCardStyle] = useState(menuDisplay.card_style || "standard");
  const [showOffers, setShowOffers] = useState(menuDisplay.show_offers ?? true);
  const [showDietaryBadges, setShowDietaryBadges] = useState(menuDisplay.show_dietary_badges ?? true);

  // Sync from restaurant prop
  useEffect(() => {
    if (restaurant) {
      setPrimaryColor(restaurant.primary_color || "#3B82F6");
      setSecondaryColor(restaurant.secondary_color || "#10B981");
      setFontFamily(restaurant.font_family || "Inter");
      setLogoUrl(restaurant.logo_url || "");
      setFaviconUrl(restaurant.favicon_url || "");
      setBannerUrl(restaurant.banner_image_url || "");
      setCoverUrl(restaurant.cover_image_url || "");
      const tc = (restaurant.theme_config as any) || {};
      setButtonStyle(tc.button_style || "rounded");
      setAnimFadeIn(tc.anim_fade_in ?? true);
      setAnimHoverZoom(tc.anim_hover_zoom ?? true);
      const md = (restaurant.settings as any)?.menu_display || {};
      setViewMode(md.view_mode || "grid");
      setCardStyle(md.card_style || "standard");
      setShowOffers(md.show_offers ?? true);
      setShowDietaryBadges(md.show_dietary_badges ?? true);
    }
  }, [restaurant]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const existingSettings = (restaurant?.settings as Record<string, any>) || {};
      const updatedSettings: Json = {
        ...existingSettings,
        menu_display: {
          view_mode: viewMode,
          card_style: cardStyle,
          show_offers: showOffers,
          show_dietary_badges: showDietaryBadges,
        },
      };

      const updatedThemeConfig: Json = {
        ...(restaurant?.theme_config as Record<string, any> || {}),
        button_style: buttonStyle,
        anim_fade_in: animFadeIn,
        anim_hover_zoom: animHoverZoom,
      };

      const { error } = await supabase
        .from("restaurants")
        .update({
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          font_family: fontFamily,
          logo_url: logoUrl || null,
          favicon_url: faviconUrl || null,
          banner_image_url: bannerUrl || null,
          cover_image_url: coverUrl || null,
          theme_config: updatedThemeConfig,
          settings: updatedSettings,
        })
        .eq("id", restaurantId);

      if (error) throw error;
      toast({ title: "Appearance Saved", description: "Changes will reflect on the customer menu instantly." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: typeof THEME_PRESETS[0]) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setFontFamily(preset.font);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Appearance Studio
          </h2>
          <p className="text-sm text-muted-foreground">Customize your customer menu look & feel</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="theme" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="typography">Fonts</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="logos">Logos</TabsTrigger>
          <TabsTrigger value="animations">Effects</TabsTrigger>
        </TabsList>

        {/* Theme Colors Tab */}
        <TabsContent value="theme" className="space-y-4 mt-4">
          {/* Color Pickers */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Brand Colors</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Primary Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-lg border cursor-pointer" />
                    <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono text-xs" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Secondary Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-10 h-10 rounded-lg border cursor-pointer" />
                    <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="font-mono text-xs" />
                  </div>
                </div>
              </div>
              {/* Live Preview */}
              <div className="flex items-center gap-3 pt-2">
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: primaryColor }} />
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: secondaryColor }} />
                <span className="text-xs text-muted-foreground">Preview</span>
              </div>
            </CardContent>
          </Card>

          {/* Theme Presets */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Quick Presets</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="flex items-center gap-2 p-3 rounded-xl border hover:border-primary/50 hover:bg-accent/50 transition-all text-left"
                  >
                    <div className="flex gap-1">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.secondary }} />
                    </div>
                    <span className="text-xs font-medium">{preset.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Type className="w-4 h-4" /> Font Family</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font} value={font}>
                      <span style={{ fontFamily: font }}>{font}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Preview */}
              <div className="p-4 rounded-xl border bg-muted/30" style={{ fontFamily }}>
                <h3 className="font-bold text-lg mb-1">Menu Heading Preview</h3>
                <p className="text-sm text-muted-foreground">This is how your menu text will look with {fontFamily}.</p>
                <p className="font-bold text-primary mt-2">₹299</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Menu Layout</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* View Mode */}
              <div>
                <Label className="text-xs mb-2 block">Default View Mode</Label>
                <div className="flex gap-2">
                  <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
                    <LayoutGrid className="w-4 h-4 mr-1" /> Grid
                  </Button>
                  <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
                    <List className="w-4 h-4 mr-1" /> List
                  </Button>
                </div>
              </div>

              {/* Card Density */}
              <div>
                <Label className="text-xs mb-2 block">Card Density</Label>
                <div className="flex gap-2">
                  {(["compact", "standard", "detailed"] as const).map((style) => (
                    <Button
                      key={style}
                      variant={cardStyle === style ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCardStyle(style)}
                      className="capitalize"
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Button Style */}
              <div>
                <Label className="text-xs mb-2 block">Button Style</Label>
                <div className="flex gap-2">
                  {(["rounded", "pill", "square"] as const).map((style) => (
                    <Button
                      key={style}
                      variant={buttonStyle === style ? "default" : "outline"}
                      size="sm"
                      onClick={() => setButtonStyle(style)}
                      className="capitalize"
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Show Offers Slider</Label>
                  <Switch checked={showOffers} onCheckedChange={setShowOffers} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Show Dietary Badges</Label>
                  <Switch checked={showDietaryBadges} onCheckedChange={setShowDietaryBadges} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logos Tab */}
        <TabsContent value="logos" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Header Logo</CardTitle></CardHeader>
              <CardContent>
                <ImageUpload
                  currentImageUrl={logoUrl}
                  onImageUploaded={setLogoUrl}
                  restaurantId={restaurantId}
                  folder="branding"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Favicon</CardTitle></CardHeader>
              <CardContent>
                <ImageUpload
                  currentImageUrl={faviconUrl}
                  onImageUploaded={setFaviconUrl}
                  restaurantId={restaurantId}
                  folder="branding"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Banner Image</CardTitle></CardHeader>
              <CardContent>
                <ImageUpload
                  currentImageUrl={bannerUrl}
                  onImageUploaded={setBannerUrl}
                  restaurantId={restaurantId}
                  folder="branding"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Cover Image</CardTitle></CardHeader>
              <CardContent>
                <ImageUpload
                  currentImageUrl={coverUrl}
                  onImageUploaded={setCoverUrl}
                  restaurantId={restaurantId}
                  folder="branding"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Animations Tab */}
        <TabsContent value="animations" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" /> Animation Controls</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Fade-in Animation</Label>
                  <p className="text-xs text-muted-foreground">Items fade in as they appear</p>
                </div>
                <Switch checked={animFadeIn} onCheckedChange={setAnimFadeIn} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Hover Zoom on Images</Label>
                  <p className="text-xs text-muted-foreground">Images zoom slightly on hover</p>
                </div>
                <Switch checked={animHoverZoom} onCheckedChange={setAnimHoverZoom} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
