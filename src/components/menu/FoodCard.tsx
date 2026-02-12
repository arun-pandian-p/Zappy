import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FoodCardProps {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isVegetarian?: boolean;
  isPopular?: boolean;
  currencySymbol?: string;
  quantity?: number;
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
  currencySymbol = "₹",
  quantity = 0,
  onAdd,
  onIncrement,
  onDecrement,
}: FoodCardProps) {
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
        <div className="relative aspect-square overflow-hidden">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
          
          {/* Veg Badge - Top Left */}
          {isVegetarian && (
            <Badge className="absolute top-2 left-2 bg-success hover:bg-success text-success-foreground text-[10px] font-semibold px-1.5 py-0 rounded">
              Veg
            </Badge>
          )}
          
          {/* Popular Badge - Top Right */}
          {isPopular && (
            <Badge className="absolute top-2 right-2 bg-success hover:bg-success text-success-foreground text-[10px] font-semibold px-1.5 py-0 rounded">
              Popular
            </Badge>
          )}
        </div>

        {/* Content Section */}
        <CardContent className="p-3">
          <h3 className="font-bold text-sm text-foreground mb-0.5 line-clamp-1">
            {name}
          </h3>
          
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
              {description}
            </p>
          )}

          {/* Price and Add Button Row */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-success text-sm">
              {currencySymbol}{Number(price).toFixed(0)}
            </span>

            {quantity === 0 ? (
              <Button
                size="sm"
                onClick={onAdd}
                className="bg-success hover:bg-success/90 text-success-foreground font-semibold px-3 h-7 text-xs"
              >
                <Plus className="w-3 h-3 mr-0.5" />
                Add
              </Button>
            ) : (
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onDecrement}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-5 text-center font-semibold text-xs">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onIncrement}
                >
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
