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
        <div className="relative aspect-[3/2] overflow-hidden">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
          
          {/* Veg Badge - Top Left */}
          {isVegetarian && (
            <Badge className="absolute top-1.5 left-1.5 bg-success hover:bg-success text-success-foreground text-[9px] font-semibold px-1 py-0 rounded">
              Veg
            </Badge>
          )}
          
          {/* Popular Badge - Top Right */}
          {isPopular && (
            <Badge className="absolute top-1.5 right-1.5 bg-success hover:bg-success text-success-foreground text-[9px] font-semibold px-1 py-0 rounded">
              Popular
            </Badge>
          )}
        </div>

        {/* Content Section */}
        <CardContent className="p-2">
          <h3 className="font-semibold text-xs text-foreground mb-1 line-clamp-1">
            {name}
          </h3>

          {/* Price and Add Button Row */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-success text-xs">
              {currencySymbol}{Number(price).toFixed(0)}
            </span>

            {quantity === 0 ? (
              <Button
                size="sm"
                onClick={onAdd}
                className="bg-success hover:bg-success/90 text-success-foreground font-semibold px-2 h-6 text-[10px]"
              >
                <Plus className="w-3 h-3 mr-0.5" />
                Add
              </Button>
            ) : (
              <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={onDecrement}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-4 text-center font-semibold text-[10px]">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
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
