import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import { AnimatedHotelName, type LetterAnimation, type AnimationSpeed } from "./AnimatedHotelName";
import { MascotIcon, type MascotType } from "./MascotIcon";
import { ImageUpload } from "@/components/admin/ImageUpload";

export interface BrandingConfig {
  animation_enabled: boolean;
  letter_animation: LetterAnimation;
  mascot: MascotType;
  mascot_image_url?: string;
  animation_speed: AnimationSpeed;
  glow_color_sync: boolean;
}

export const defaultBrandingConfig: BrandingConfig = {
  animation_enabled: false,
  letter_animation: "bounce",
  mascot: "none",
  mascot_image_url: "",
  animation_speed: "normal",
  glow_color_sync: true,
};

interface BrandingAnimationSettingsProps {
  config: BrandingConfig;
  onChange: (config: BrandingConfig) => void;
  restaurantName?: string;
  primaryColor?: string;
  restaurantId?: string;
}

export function BrandingAnimationSettings({
  config,
  onChange,
  restaurantName = "Hotel Name",
  primaryColor,
  restaurantId,
}: BrandingAnimationSettingsProps) {
  const update = (partial: Partial<BrandingConfig>) =>
    onChange({ ...config, ...partial });

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Branding Animations
        </CardTitle>
        <CardDescription>
          Animated hotel name and mascot for the customer menu
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Enable Animations</Label>
            <p className="text-sm text-muted-foreground">
              Animate the hotel name in headers and splash screen
            </p>
          </div>
          <Switch
            checked={config.animation_enabled}
            onCheckedChange={(v) => update({ animation_enabled: v })}
          />
        </div>

        {config.animation_enabled && (
          <>
            {/* Mascot */}
            <div className="space-y-2">
              <Label>Mascot Theme</Label>
              <Select
                value={config.mascot}
                onValueChange={(v) => update({ mascot: v as MascotType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="custom">📷 Custom Upload</SelectItem>
                  <SelectItem value="lion">🦁 Lion</SelectItem>
                  <SelectItem value="tiger">🐯 Tiger</SelectItem>
                  <SelectItem value="elephant">🐘 Elephant</SelectItem>
                  <SelectItem value="peacock">🦚 Peacock</SelectItem>
                  <SelectItem value="fish">🐟 Fish</SelectItem>
                  <SelectItem value="owl">🦉 Owl</SelectItem>
                  <SelectItem value="panda">🐼 Panda</SelectItem>
                  <SelectItem value="horse">🐴 Horse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom mascot upload */}
            {config.mascot === "custom" && restaurantId && (
              <div className="space-y-2">
                <Label>Upload Logo / Mascot Image</Label>
                <ImageUpload
                  currentImageUrl={config.mascot_image_url || ""}
                  onImageUploaded={(url) => update({ mascot_image_url: url })}
                  restaurantId={restaurantId}
                  folder="mascots"
                />
                {config.mascot_image_url && (
                  <div className="flex items-center gap-2 mt-2">
                    <img src={config.mascot_image_url} alt="Custom mascot" className="w-10 h-10 rounded-full object-cover border" />
                    <span className="text-sm text-muted-foreground">Current mascot</span>
                  </div>
                )}
              </div>
            )}

            {/* Letter animation */}
            <div className="space-y-2">
              <Label>Letter Animation</Label>
              <Select
                value={config.letter_animation}
                onValueChange={(v) => update({ letter_animation: v as LetterAnimation })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bounce">Bounce</SelectItem>
                  <SelectItem value="wave">Wave</SelectItem>
                  <SelectItem value="glow">Glow Pulse</SelectItem>
                  <SelectItem value="slide">Slide Reveal</SelectItem>
                  <SelectItem value="typing">Typing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Speed */}
            <div className="space-y-2">
              <Label>Animation Speed</Label>
              <Select
                value={config.animation_speed}
                onValueChange={(v) => update({ animation_speed: v as AnimationSpeed })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">Slow</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="fast">Fast</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Glow sync */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Sync Glow to Theme Color</Label>
                <p className="text-sm text-muted-foreground">
                  Use your primary color for glow effects
                </p>
              </div>
              <Switch
                checked={config.glow_color_sync}
                onCheckedChange={(v) => update({ glow_color_sync: v })}
              />
            </div>

            {/* Live Preview */}
            <div className="rounded-xl border bg-muted/30 p-6 text-center space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Live Preview
              </p>
              <div className="flex items-center justify-center gap-2">
                 <MascotIcon
                   mascot={config.mascot}
                   size={36}
                   primaryColor={primaryColor}
                   customImageUrl={config.mascot_image_url}
                 />
                <AnimatedHotelName
                  name={restaurantName}
                  animation={config.letter_animation}
                  speed={config.animation_speed}
                  primaryColor={config.glow_color_sync ? primaryColor : undefined}
                  className="text-xl font-bold"
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
