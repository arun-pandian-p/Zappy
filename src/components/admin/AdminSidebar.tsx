import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureGate, type FeatureKey, type LockReason } from "@/hooks/useFeatureGate";
import { FeatureLockedModal } from "@/components/admin/FeatureLockedModal";
import type { Database } from "@/integrations/supabase/types";
import { ZappyLogo } from "@/components/branding/ZappyLogo";
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
  Gift,
  Eye,
  FileSpreadsheet,
  Ticket,
  Globe,
  QrCode,
  Lock,
  Package,
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
  { title: "Menu", icon: UtensilsCrossed, value: "menu" },
  { title: "QR Manager", icon: QrCode, value: "qr-manager" },
  { title: "Orders", icon: ClipboardList, value: "orders" },
  { title: "Kitchen", icon: ChefHat, value: "kitchen" },
  { title: "Billing", icon: Receipt, value: "billing" },
  { title: "Coupons", icon: Ticket, value: "coupons" },
  { title: "Ads", icon: Megaphone, value: "ads" },
  { title: "Offers", icon: Gift, value: "offers" },
  { title: "Reviews", icon: Star, value: "reviews" },
  { title: "Users", icon: Users, value: "users" },
  { title: "Inventory", icon: Package, value: "inventory" },
  { title: "Exports", icon: FileSpreadsheet, value: "exports" },
  { title: "Research", icon: Globe, value: "research" },
  { title: "Preview Site", icon: Eye, value: "preview" },
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
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, user } = useAuth();
  const navItems = onboardingCompleted ? allNavItems : onboardingNavItems;
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Admin";

  const { canAccess, isLocked } = useFeatureGate(subscriptionTier, adsEnabled);

  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [lockModalFeature, setLockModalFeature] = useState("");
  const [lockModalReason, setLockModalReason] = useState<LockReason>(null);

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

  return (
    <>
      <Sidebar className="border-r-0 bg-sidebar" collapsible="icon">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
            <ZappyLogo size={32} compact />
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

        <SidebarFooter className="p-4 mt-auto border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="w-8 h-8 shrink-0 rounded-lg">
              <AvatarImage src={restaurantLogo || undefined} className="rounded-lg" />
              <AvatarFallback className="bg-primary/20 text-primary rounded-lg text-xs">
                {(restaurantName || "R").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
                <span className="font-semibold text-sm text-sidebar-foreground truncate block">
                  {restaurantName || "Restaurant"}
                </span>
              </motion.div>
            )}
          </div>

          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-9 h-9 shrink-0">
              <AvatarImage src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'admin'}`} />
              <AvatarFallback className="bg-primary/20 text-primary text-sm">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
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
              collapsed && "justify-center px-2"
            )}
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
    </>
  );
}
