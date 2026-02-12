import { Search, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnimatedHotelName, type LetterAnimation, type AnimationSpeed } from "@/components/branding/AnimatedHotelName";
import { MascotIcon, type MascotType } from "@/components/branding/MascotIcon";

interface BrandingConfig {
  animation_enabled?: boolean;
  letter_animation?: LetterAnimation;
  mascot?: MascotType;
  mascot_image_url?: string;
  animation_speed?: AnimationSpeed;
  glow_color_sync?: boolean;
}

interface AdminAvatarConfig {
  type?: "upload" | "emoji" | "mascot";
  value?: string;
}

interface AdminHeaderProps {
  restaurantName?: string;
  primaryColor?: string;
  branding?: BrandingConfig;
  adminAvatar?: AdminAvatarConfig;
  adminDisplayName?: string;
}

export function AdminHeader({
  restaurantName = "Restaurant Name",
  primaryColor,
  branding,
  adminAvatar,
  adminDisplayName,
}: AdminHeaderProps) {
  const animEnabled = branding?.animation_enabled ?? false;

  return (
    <header className="sticky top-0 z-40 bg-card border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          {animEnabled && branding?.mascot && branding.mascot !== "none" && (
            <MascotIcon mascot={branding.mascot} size={36} primaryColor={primaryColor} customImageUrl={branding?.mascot_image_url} />
          )}
          <div>
            {animEnabled ? (
              <AnimatedHotelName
                name={restaurantName}
                animation={branding?.letter_animation || "bounce"}
                speed={branding?.animation_speed || "normal"}
                primaryColor={branding?.glow_color_sync ? primaryColor : undefined}
                className="text-xl font-bold text-foreground"
              />
            ) : (
              <h1 className="text-xl font-bold text-foreground">{restaurantName}</h1>
            )}
            <p className="text-sm text-muted-foreground">Manage your restaurant</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Settings className="w-5 h-5" />
          </Button>
          <Avatar className="w-9 h-9 ml-2">
            {adminAvatar?.type === "emoji" && adminAvatar.value ? (
              <AvatarFallback className="text-lg bg-primary/10">{adminAvatar.value}</AvatarFallback>
            ) : (
              <AvatarImage src={adminAvatar?.type === "upload" && adminAvatar.value ? adminAvatar.value : "https://api.dicebear.com/7.x/avataaars/svg?seed=admin"} />
            )}
            <AvatarFallback className="bg-primary/20 text-primary text-sm">
              {adminDisplayName ? adminDisplayName.charAt(0).toUpperCase() : "AD"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
