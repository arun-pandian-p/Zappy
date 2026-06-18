import { Search, Settings, Bell, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
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

interface AdminHeaderProps {
  restaurantName?: string;
  primaryColor?: string;
  branding?: BrandingConfig;
  logoUrl?: string | null;
}

export function AdminHeader({
  restaurantName = "Restaurant Name",
  primaryColor,
  branding,
  logoUrl,
}: AdminHeaderProps) {
  const { user } = useAuth();
  const animEnabled = branding?.animation_enabled ?? false;
  const emailPrefix = user?.email?.split('@')[0] || "";

  // Sync avatar & name with sidebar (both use auth user_metadata)
  const displayName = user?.user_metadata?.full_name || emailPrefix || "Admin";
  const avatarUrl = user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'admin'}`;

  return (
    <header className="sticky top-0 z-40 bg-card border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          {animEnabled && branding?.mascot && branding.mascot !== "none" && (
            <MascotIcon mascot={branding.mascot} size={36} primaryColor={primaryColor} customImageUrl={branding?.mascot_image_url} />
          )}
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={restaurantName}
              className="w-10 h-10 rounded-xl object-cover border-2 border-primary/20 shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-lg">
              {restaurantName.charAt(0)}
            </div>
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
          {user?.email && (
            <Badge variant="secondary" className="hidden sm:flex items-center gap-1 text-xs">
              <Mail className="w-3 h-3" />
              {user.email}
            </Badge>
          )}
          {user?.email && (
            <Badge variant="secondary" className="flex sm:hidden items-center gap-1 text-xs">
              <Mail className="w-3 h-3" />
              {emailPrefix}
            </Badge>
          )}
          <Avatar className="w-9 h-9 ml-2">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-primary/20 text-primary text-sm">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
