import { motion } from "framer-motion";
import { Leaf, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import type { MenuItem } from "@/hooks/useMenuItems";

interface MenuPreviewCardProps {
  item: MenuItem;
  currencySymbol?: string;
  index?: number;
  isSelected?: boolean;
  onToggleSelect?: (checked: boolean) => void;
  isDuplicate?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleAvailability?: (checked: boolean) => void;
}

export function MenuPreviewCard({
  item,
  currencySymbol = "₹",
  index = 0,
  isSelected = false,
  onToggleSelect,
  isDuplicate = false,
  onEdit,
  onDelete,
  onToggleAvailability,
}: MenuPreviewCardProps) {
  if (!item) return null;
  const safeItem = item ?? {};
  
  const displayName = safeItem?.name ?? "Menu Item";
  const displayPrice = safeItem?.price ?? 0;
  const displayDesc = safeItem?.description ?? "No description";
  const displayImage = safeItem?.image_url ?? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 + index * 0.05 }}
      className={`h-full ${!safeItem?.is_available ? 'opacity-70 grayscale-[0.3]' : ''}`}
    >
      <Card className={`group h-full flex flex-col overflow-hidden border shadow-md card-hover bg-card transition-all ${
        isSelected ? 'ring-2 ring-primary border-primary' : 'border-border/50'
      }`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={displayImage}
            alt={displayName}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80"; }}
          />
          
          {/* Checkbox for individual selection */}
          {onToggleSelect && (
            <div className={`absolute top-2 right-2 z-20 transition-opacity ${
              isSelected ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
            }`}>
              <div 
                className="bg-white/95 dark:bg-zinc-900/95 p-1 rounded-md shadow-md border border-border/50 flex items-center justify-center cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(!isSelected);
                }}
              >
                <Checkbox 
                  checked={isSelected}
                  onCheckedChange={(val) => onToggleSelect(!!val)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          )}

          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
            {isDuplicate && (
              <Badge className="bg-amber-500/90 text-white border-0 text-[10px] shadow-sm animate-pulse">
                Duplicate
              </Badge>
            )}
            {safeItem?.is_vegetarian !== null && safeItem?.is_vegetarian !== undefined && (
              <Badge className={`border-0 text-[10px] gap-1 ${safeItem?.is_vegetarian ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                <Leaf className="w-3 h-3" />
                {safeItem?.is_vegetarian ? 'Veg' : 'Non-Veg'}
              </Badge>
            )}
            {safeItem?.is_popular && (
              <Badge className="bg-amber-500 text-white border-0 text-[10px]">
                Popular
              </Badge>
            )}
          </div>
          
          {/* Admin actions overlay */}
          <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {onEdit && (
              <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-sm" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Pencil className="w-3.5 h-3.5 text-zinc-700" />
              </Button>
            )}
            {onDelete && (
              <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-sm" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
        
        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h4 className="font-semibold text-foreground line-clamp-1">{displayName}</h4>
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{displayDesc}</p>
          
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/40">
            <span className="text-lg font-bold text-primary">
              {currencySymbol}{Number(displayPrice).toFixed(0)}
            </span>
            
            {onToggleAvailability && (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {safeItem?.is_available ? 'Available' : 'Hidden'}
                </span>
                <Switch 
                  checked={!!safeItem?.is_available} 
                  onCheckedChange={onToggleAvailability} 
                  className="scale-75 data-[state=checked]:bg-emerald-500"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
