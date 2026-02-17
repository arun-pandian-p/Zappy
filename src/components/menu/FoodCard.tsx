import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type CardStyle = 'compact' | 'standard' | 'detailed';

interface FoodCardProps {
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

export function FoodCard({
  id,
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
}: FoodCardProps) {
  const isCompact = cardStyle === "compact";
  const isDetailed = cardStyle === "detailed";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden card-hover border-0 shadow-md">
        {/* Image Section with Badges */}
        <div className={`relative overflow-hidden ${isCompact ? "aspect-[2/1]" : isDetailed ? "aspect-[4/3]" : "aspect-[3/2]"}`}>
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
          
          {isVegetarian && (
            <Badge className="absolute top-1.5 left-1.5 bg-success hover:bg-success text-success-foreground text-[9px] font-semibold px-1 py-0 rounded">
              Veg
            </Badge>
          )}
          
          {isPopular && (
            <Badge className="absolute top-1.5 right-1.5 bg-success hover:bg-success text-success-foreground text-[9px] font-semibold px-1 py-0 rounded">
              Popular
            </Badge>
          )}
        </div>

        {/* Content Section */}
        <CardContent className={isCompact ? "p-1.5" : "p-2"}>
          <h3 className={`font-semibold text-foreground line-clamp-1 ${isCompact ? "text-[10px] mb-0.5" : "text-xs mb-1"}`}>
            {name}
          </h3>

          {/* Description - only in detailed mode */}
          {isDetailed && description && (
            <p className="text-[10px] text-muted-foreground line-clamp-2 mb-1">{description}</p>
          )}

          {/* Prep time & spicy - detailed only */}
          {isDetailed && (
            <div className="flex items-center gap-1.5 mb-1">
              {prepTime && <span className="text-[9px] text-muted-foreground">⏱ {prepTime}m</span>}
              {spicyLevel && spicyLevel > 0 && (
                <span className="text-[9px]">{"🌶️".repeat(Math.min(spicyLevel, 3))}</span>
              )}
            </div>
          )}

          {/* Price and Add Button Row */}
          <div className="flex items-center justify-between">
            <span className={`font-bold text-success ${isCompact ? "text-[10px]" : "text-xs"}`}>
              {currencySymbol}{Number(price).toFixed(0)}
            </span>

            {quantity === 0 ? (
              <Button
                size="sm"
                onClick={onAdd}
                className={`bg-success hover:bg-success/90 text-success-foreground font-semibold ${isCompact ? "px-1.5 h-5 text-[9px]" : "px-2 h-6 text-[10px]"}`}
              >
                <Plus className={isCompact ? "w-2.5 h-2.5 mr-0.5" : "w-3 h-3 mr-0.5"} />
                Add
              </Button>
            ) : (
              <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onDecrement}>
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-4 text-center font-semibold text-[10px]">{quantity}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onIncrement}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
