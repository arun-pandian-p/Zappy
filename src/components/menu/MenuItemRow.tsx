import { motion } from "framer-motion";
import { Plus, Minus, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type CardStyle = 'compact' | 'standard' | 'detailed';

interface MenuItemRowProps {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isVegetarian?: boolean;
  isPopular?: boolean;
  prepTime?: number | null;
  spicyLevel?: number | null;
  currencySymbol?: string;
  quantity?: number;
  cardStyle?: CardStyle;
  onAdd: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export function MenuItemRow({
  name,
  description,
  price,
  imageUrl,
  isVegetarian,
  isPopular,
  prepTime,
  spicyLevel,
  currencySymbol = "₹",
  quantity = 0,
  cardStyle = "standard",
  onAdd,
  onIncrement,
  onDecrement,
}: MenuItemRowProps) {
  const isCompact = cardStyle === "compact";
  const isDetailed = cardStyle === "detailed";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`flex items-center gap-3 rounded-xl bg-card border shadow-sm ${isCompact ? "p-2" : "p-3"}`}
    >
      {/* Thumbnail */}
      <div className={`rounded-xl overflow-hidden flex-shrink-0 ${isCompact ? "w-14 h-14" : isDetailed ? "w-24 h-24" : "w-20 h-20"}`}>
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {isVegetarian && (
            <span className="w-4 h-4 rounded-sm border-2 border-success flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-success" />
            </span>
          )}
          <h4 className={`font-semibold truncate ${isCompact ? "text-xs" : "text-sm"}`}>{name}</h4>
        </div>

        {!isCompact && description && (
          <p className={`text-xs text-muted-foreground mb-1 ${isDetailed ? "line-clamp-2" : "line-clamp-1"}`}>
            {description}
          </p>
        )}

        <div className="flex items-center gap-2">
          {prepTime && (
            <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              {prepTime}m
            </span>
          )}
          {isDetailed && spicyLevel && spicyLevel > 0 && (
            <span className="text-[11px]">{"🌶️".repeat(Math.min(spicyLevel, 3))}</span>
          )}
          {isPopular && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 bg-success/10 text-success border-0"
            >
              Popular
            </Badge>
          )}
        </div>
      </div>

      {/* Price + Add */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className={`font-bold text-success ${isCompact ? "text-xs" : "text-sm"}`}>
          {currencySymbol}
          {Number(price).toFixed(0)}
        </span>

        {quantity === 0 ? (
          <Button
            size="sm"
            onClick={onAdd}
            className={`rounded-lg bg-success hover:bg-success/90 text-success-foreground font-semibold ${isCompact ? "h-7 px-3 text-[10px]" : "h-8 px-4 text-xs"}`}
          >
            <Plus className="w-3.5 h-3.5 mr-0.5" />
            ADD
          </Button>
        ) : (
          <div className="flex items-center gap-1 bg-success/10 rounded-lg px-1 h-8">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-success hover:bg-success/20" onClick={onDecrement}>
              <Minus className="w-3.5 h-3.5" />
            </Button>
            <span className="w-5 text-center font-bold text-xs text-success">{quantity}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-success hover:bg-success/20" onClick={onIncrement}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
