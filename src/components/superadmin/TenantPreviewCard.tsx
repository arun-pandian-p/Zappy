import { Building2, Eye, QrCode, Power, Edit2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Tables } from "@/integrations/supabase/types";

type Restaurant = Tables<"restaurants">;

interface TenantPreviewCardProps {
  restaurant: Restaurant;
  onToggleActive: (id: string, currentValue: boolean) => void;
  onViewDetails: (id: string) => void;
}

export function TenantPreviewCard({ restaurant, onToggleActive, onViewDetails }: TenantPreviewCardProps) {
  const tierColor = restaurant.subscription_tier === "enterprise"
    ? "bg-purple-500"
    : restaurant.subscription_tier === "pro"
    ? "bg-blue-500"
    : "bg-muted";

  return (
    <Card className="border-0 shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Color accent bar */}
      <div
        className="h-1.5"
        style={{ backgroundColor: restaurant.primary_color || "hsl(var(--primary))" }}
      />
      <CardContent className="p-4 space-y-3">
        {/* Logo + Name */}
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 rounded-lg">
            <AvatarImage src={restaurant.logo_url || ""} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-sm">
              {restaurant.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{restaurant.name}</h4>
            <code className="text-xs text-muted-foreground">{restaurant.slug}</code>
          </div>
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: restaurant.primary_color || "hsl(var(--primary))" }}
            title="Theme color"
          />
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`${tierColor} text-white text-xs`}>
            {restaurant.subscription_tier || "free"}
          </Badge>
          <Badge variant={restaurant.is_active ? "outline" : "destructive"} className="text-xs">
            {restaurant.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onViewDetails(restaurant.id)}>
            <Edit2 className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onToggleActive(restaurant.id, restaurant.is_active ?? false)}
          >
            <Power className="w-3 h-3 mr-1" />
            {restaurant.is_active ? "Suspend" : "Activate"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
