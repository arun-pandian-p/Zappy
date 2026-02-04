import { Search, Settings, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AdminHeaderProps {
  restaurantName?: string;
}

export function AdminHeader({ restaurantName = "Restaurant Name" }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-card border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <div>
            <h1 className="text-xl font-bold text-foreground">{restaurantName}</h1>
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
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
            <AvatarFallback className="bg-primary/20 text-primary text-sm">AD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
