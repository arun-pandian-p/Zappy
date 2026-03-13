import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureGate, type FeatureKey, type LockReason } from "@/hooks/useFeatureGate";
import { FeatureLockedModal } from "@/components/admin/FeatureLockedModal";
import { ImageCropDialog } from "@/components/admin/ImageCropDialog";
import type { Database } from "@/integrations/supabase/types";
import { ZappyLogo } from "@/components/branding/ZappyLogo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Settings,
  LogOut,
  ClipboardList,
  ChefHat,
  Receipt,
  Megaphone,
  Star,
  Users,
  Eye,
  FileSpreadsheet,
  Ticket,
  QrCode,
  Lock,
  Package,
  Camera,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SubscriptionTier = Database["public"]["Enums"]["subscription_tier"];

interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
}

const allNavItems: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, value: "dashboard" },
  { title: "Preview Site", icon: Eye, value: "preview" },
  { title: "Menu", icon: UtensilsCrossed, value: "menu" },
  { title: "QR Manager", icon: QrCode, value: "qr-manager" },
  { title: "Orders", icon: ClipboardList, value: "orders" },
  { title: "Kitchen", icon: ChefHat, value: "kitchen" },
  { title: "Billing", icon: Receipt, value: "billing" },
  { title: "Coupons", icon: Ticket, value: "coupons" },
  { title: "Promotions", icon: Megaphone, value: "promotions" },
  { title: "Reviews", icon: Star, value: "reviews" },
  { title: "Users", icon: Users, value: "users" },
  { title: "Inventory", icon: Package, value: "inventory" },
  { title: "Exports", icon: FileSpreadsheet, value: "exports" },
  { title: "Settings", icon: Settings, value: "settings" },
];

const onboardingNavItems: NavItem[] = [
  { title: "Settings", icon: Settings, value: "settings" },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onboardingCompleted?: boolean;
  restaurantName?: string;
  restaurantLogo?: string | null;
  subscriptionTier?: SubscriptionTier | null;
  adsEnabled?: boolean | null;
}

export function AdminSidebar({
  activeTab,
  onTabChange,
  onboardingCompleted = true,
  restaurantName,
  restaurantLogo,
  subscriptionTier,
  adsEnabled,
}: AdminSidebarProps) {
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, user } = useAuth();
  const navItems = onboardingCompleted ? allNavItems : onboardingNavItems;
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Admin";

  const { canAccess, isLocked } = useFeatureGate(subscriptionTier, adsEnabled);

  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [lockModalFeature, setLockModalFeature] = useState("");
  const [lockModalReason, setLockModalReason] = useState<LockReason>(null);

  // Avatar upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleNavClick = (item: NavItem) => {
    const featureKey = item.value as FeatureKey;
    const reason = isLocked(featureKey);
    if (reason) {
      setLockModalFeature(item.title);
      setLockModalReason(reason);
      setLockModalOpen(true);
    } else {
      onTabChange(item.value);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result as string);
    reader.readAsDataURL(file);
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  const handleCropComplete = async (croppedDataUrl: string) => {
    setCropImageSrc(null);
    if (!user) return;

    setUploading(true);
    try {
      // Convert data URL to blob
      const res = await fetch(croppedDataUrl);
      const blob = await res.blob();
      const filePath = `${user.id}/avatar.jpg`;

      // Upload to storage (upsert)
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, blob, { upsert: true, contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl },
      });

      if (updateError) throw updateError;

      toast.success("Profile photo updated!");
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      toast.error("Failed to update profile photo");
    } finally {
      setUploading(false);
    }
  };

  const avatarUrl = user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'admin'}`;

  return (
    <>
      <Sidebar className="border-r-0 bg-sidebar" collapsible="icon">
        <SidebarHeader className="p-4">
          <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
            <div className="flex items-center gap-3">
              <ZappyLogo size={collapsed ? 36 : 48} compact variant="dark" />
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col"
                >
                  <span className="font-bold text-sidebar-foreground">{restaurantName || "ZAPPY"}</span>
                  <span className="text-xs text-sidebar-foreground/60">Admin Dashboard</span>
                </motion.div>
              )}
            </div>
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent shrink-0"
              >
                <PanelLeftClose className="w-4 h-4" />
              </Button>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 py-4">
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive = activeTab === item.value;
              const reason = isLocked(item.value as FeatureKey);
              const locked = !!reason;

              return (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    onClick={() => handleNavClick(item)}
                    tooltip={locked ? `${item.title} (Locked)` : item.title}
                    className={cn(
                      "w-full justify-start gap-3 rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : locked
                          ? "text-sidebar-foreground/40 hover:bg-sidebar-accent/50"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!collapsed && (
                      <span className="font-medium flex-1">{item.title}</span>
                    )}
                    {!collapsed && locked && (
                      <Lock className="w-3.5 h-3.5 shrink-0 opacity-60" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className={cn("mt-auto border-t border-sidebar-border", collapsed ? "p-2" : "p-4")}>
          <div className={cn("flex items-center", collapsed ? "flex-col gap-2" : "gap-3 mb-3")}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={handleAvatarClick}
              className="relative group shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              title="Change profile photo"
              disabled={uploading}
            >
              <Avatar className={cn(collapsed ? "w-8 h-8" : "w-9 h-9", uploading && "opacity-50")}>
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/50 transition-colors">
                <Camera className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>

            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col overflow-hidden">
                <Badge variant="secondary" className="w-fit text-xs mb-0.5">{displayName}</Badge>
                <span className="text-xs text-sidebar-foreground/60 truncate">
                  {user?.email || "admin@restaurant.com"}
                </span>
              </motion.div>
            )}
          </div>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10",
              collapsed && "justify-center px-0"
            )}
            size={collapsed ? "icon" : "default"}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </Button>
        </SidebarFooter>
      </Sidebar>

      <FeatureLockedModal
        open={lockModalOpen}
        onOpenChange={setLockModalOpen}
        featureName={lockModalFeature}
        lockReason={lockModalReason}
        onGoToSettings={() => onTabChange("settings")}
      />

      {cropImageSrc && (
        <ImageCropDialog
          open={!!cropImageSrc}
          imageSrc={cropImageSrc}
          onClose={() => setCropImageSrc(null)}
          onCropComplete={handleCropComplete}
          cropShape="round"
          aspect={1}
          title="Crop Profile Photo"
        />
      )}
    </>
  );
}
