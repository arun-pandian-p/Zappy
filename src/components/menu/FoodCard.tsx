import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Heart, Leaf, Drumstick, Star } from "lucide-react";
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
  onClick?: () => void;
}

export const FoodCard = React.forwardRef<HTMLDivElement, FoodCardProps>(({
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
  onClick,
}, ref) => {
  const [isLiked, setIsLiked] = React.useState(false);

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 15, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      onClick={onClick}
      className="cursor-pointer h-full"
    >
      <Card className="overflow-hidden card-hover border shadow-sm rounded-[20px] bg-white dark:bg-card h-full flex flex-col">
        {/* Image Section with Badges */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted m-2 rounded-[14px]">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
          
          {/* Badge - Top Left */}
          {isPopular ? (
            <Badge className="absolute top-2 left-2 bg-amber-500/90 backdrop-blur-sm hover:bg-amber-500 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full border-0 shadow-sm">
              <Star className="w-2.5 h-2.5 mr-0.5 fill-current" /> Bestseller
            </Badge>
          ) : isVegetarian ? (
            <Badge className="absolute top-2 left-2 bg-green-600/90 backdrop-blur-sm hover:bg-green-600 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full border-0 shadow-sm">
              <Leaf className="w-2.5 h-2.5 mr-0.5" /> Veg
            </Badge>
          ) : (
            <Badge className="absolute top-2 left-2 bg-red-500/90 backdrop-blur-sm hover:bg-red-500 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full border-0 shadow-sm">
              <Drumstick className="w-2.5 h-2.5 mr-0.5" /> Non-Veg
            </Badge>
          )}
          
          {/* Heart Icon - Top Right */}
          <button 
            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:scale-110 active:scale-90 transition-transform z-10"
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
          >
            <Heart className={`w-3.5 h-3.5 transition-colors ${isLiked ? "fill-rose-500 stroke-rose-500 animate-pulse" : "text-muted-foreground"}`} />
          </button>
        </div>

        {/* Content Section */}
        <CardContent className="p-3 pt-1 flex flex-col flex-1">
          <h3 className="font-bold text-sm text-foreground mb-0.5 line-clamp-1">
            {name}
          </h3>
          <p className="text-[10px] text-muted-foreground line-clamp-1 mb-2">
            {description || "Fresh & Natural"}
          </p>

          {/* Price and Add Button Row — fixed min height to prevent layout shift */}
          <div className="flex items-center justify-between mt-auto min-h-[32px]">
            <span className="font-bold text-[#008c4a] text-sm flex-shrink-0">
              {currencySymbol}{Number(price).toFixed(0)}
            </span>

            <AnimatePresence mode="wait" initial={false}>
              {quantity === 0 ? (
                <motion.div
                  key="add-btn"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdd();
                    }}
                    className="bg-[#008c4a] hover:bg-[#00703b] text-white font-medium px-3 h-7 text-[11px] rounded-full min-w-[60px]"
                  >
                    <Plus className="w-3 h-3 mr-0.5" />
                    Add
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="qty-controls"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-0.5 bg-[#008c4a] rounded-full p-0.5 h-7 min-w-[80px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full text-white hover:bg-white/20 hover:text-white flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDecrement?.();
                    }}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <motion.span
                    key={quantity}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="w-5 text-center font-semibold text-[11px] text-white flex-shrink-0"
                  >
                    {quantity}
                  </motion.span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full text-white hover:bg-white/20 hover:text-white flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onIncrement?.();
                    }}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

FoodCard.displayName = "FoodCard";
