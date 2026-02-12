import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Grid3X3,
  Settings,
  LogOut,
  ClipboardList,
  ChefHat,
  Receipt,
  Megaphone,
  Star,
  Users,
  Gift,
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
}

const allNavItems: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, value: "dashboard" },
  { title: "Menu", icon: UtensilsCrossed, value: "menu" },
  { title: "Tables & QR", icon: Grid3X3, value: "tables" },
  { title: "Orders", icon: ClipboardList, value: "orders" },
  { title: "Kitchen", icon: ChefHat, value: "kitchen" },
  { title: "Billing", icon: Receipt, value: "billing" },
  { title: "Ads", icon: Megaphone, value: "ads" },
  { title: "Offers", icon: Gift, value: "offers" },
  { title: "Reviews", icon: Star, value: "reviews" },
  { title: "Users", icon: Users, value: "users" },
  { title: "Settings", icon: Settings, value: "settings" },
];

const onboardingNavItems: NavItem[] = [
  { title: "Settings", icon: Settings, value: "settings" },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onboardingCompleted?: boolean;
}

export function AdminSidebar({ activeTab, onTabChange, onboardingCompleted = true }: AdminSidebarProps) {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const navItems = onboardingCompleted ? allNavItems : onboardingNavItems;

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <Sidebar
      className="border-r-0 bg-sidebar"
      collapsible="icon"
    >
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <img src="/qr-logo.svg" alt="QR Dine Pro" className="w-6 h-6 text-primary-foreground" style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="font-bold text-sidebar-foreground">QR Dine Pro</span>
              <span className="text-xs text-sidebar-foreground/60">Admin Dashboard</span>
            </motion.div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive = activeTab === item.value;
            return (
              <SidebarMenuItem key={item.value}>
                <SidebarMenuButton
                  onClick={() => onTabChange(item.value)}
                  tooltip={item.title}
                  className={cn(
                    "w-full justify-start gap-3 rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span className="font-medium">{item.title}</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 mt-auto border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
            <AvatarFallback className="bg-primary/20 text-primary">AD</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col overflow-hidden"
            >
              <span className="font-medium text-sm text-sidebar-foreground truncate">
                Restaurant Admin
              </span>
              <span className="text-xs text-sidebar-foreground/60 truncate">
                admin@restaurant.com
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
  );
}
