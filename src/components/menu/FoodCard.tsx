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
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
          
          {/* Veg Badge - Top Left */}
          {isVegetarian && (
            <Badge className="absolute top-3 left-3 bg-success hover:bg-success text-success-foreground text-xs font-semibold px-2 py-0.5 rounded">
              Veg
            </Badge>
          )}
          
          {/* Popular Badge - Top Right */}
          {isPopular && (
            <Badge className="absolute top-3 right-3 bg-success hover:bg-success text-success-foreground text-xs font-semibold px-2 py-0.5 rounded">
              Popular
            </Badge>
          )}
        </div>

        {/* Content Section */}
        <CardContent className="p-4">
          <h3 className="font-bold text-base text-foreground mb-1 line-clamp-1">
            {name}
          </h3>
          
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[2.5rem]">
              {description}
            </p>
          )}

          {/* Price and Add Button Row */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-success text-lg">
              {currencySymbol}{Number(price).toFixed(0)}
            </span>

            {quantity === 0 ? (
              <Button
                size="sm"
                onClick={onAdd}
                className="bg-success hover:bg-success/90 text-success-foreground font-semibold px-4"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add to Cart
              </Button>
            ) : (
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onDecrement}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-6 text-center font-semibold text-sm">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onIncrement}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
