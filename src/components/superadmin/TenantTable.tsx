import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Search, Eye, MoreHorizontal, Power, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Tables } from "@/integrations/supabase/types";

type Restaurant = Tables<"restaurants">;
type SubscriptionTier = "free" | "pro" | "enterprise";

interface TenantTableProps {
  restaurants: Restaurant[];
  onToggleActive: (id: string, currentValue: boolean) => void;
  onChangeTier: (id: string, tier: SubscriptionTier) => void;
  onViewDetails?: (id: string) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export function TenantTable({ 
  restaurants, 
  onToggleActive, 
  onChangeTier,
  onViewDetails,
  onDelete,
  isLoading 
}: TenantTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");

  const filteredRestaurants = useMemo(() => {
    let filtered = restaurants;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.slug.toLowerCase().includes(query) ||
          r.email?.toLowerCase().includes(query)
      );
    }
    
    if (tierFilter !== "all") {
      filtered = filtered.filter((r) => r.subscription_tier === tierFilter);
    }
    
    return filtered;
  }, [restaurants, searchQuery, tierFilter]);

  const getTierBadge = (tier: string | null) => {
    switch (tier) {
      case "pro":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Pro</Badge>;
      case "enterprise":
        return <Badge className="bg-purple-500 hover:bg-purple-600">Enterprise</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean | null) => {
    return isActive ? (
      <Badge variant="outline" className="border-green-500 text-green-600">Active</Badge>
    ) : (
      <Badge variant="outline" className="border-red-500 text-red-600">Inactive</Badge>
    );
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>All Tenants</CardTitle>
            <CardDescription>
              {filteredRestaurants.length} of {restaurants.length} restaurants
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Restaurant</TableHead>
                <TableHead className="font-semibold">Slug</TableHead>
                <TableHead className="font-semibold">Plan</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Created</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRestaurants.map((restaurant) => (
                <TableRow key={restaurant.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{restaurant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {restaurant.email || "No email"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {restaurant.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={restaurant.subscription_tier || "free"}
                      onValueChange={(v: SubscriptionTier) => onChangeTier(restaurant.id, v)}
                    >
                      <SelectTrigger className="w-[110px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={restaurant.is_active ?? false}
                        onCheckedChange={() => onToggleActive(restaurant.id, restaurant.is_active ?? false)}
                      />
                      {getStatusBadge(restaurant.is_active)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {restaurant.created_at
                      ? format(new Date(restaurant.created_at), "MMM d, yyyy")
                      : "--"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onViewDetails && (
                          <DropdownMenuItem onClick={() => onViewDetails(restaurant.id)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => onToggleActive(restaurant.id, restaurant.is_active ?? false)}
                        >
                          <Power className="w-4 h-4 mr-2" />
                          {restaurant.is_active ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(restaurant.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRestaurants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No restaurants found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
