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
        <div className="relative aspect-[16/10] overflow-hidden bg-muted m-2 rounded-[14px]">
          <img
            src={imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80"}
            alt={name || "Menu Item"}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80"; }}
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
          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 mb-0.5 line-clamp-1 tracking-tight">
            {name || "Menu Item"}
          </h3>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-current" />
              {(4.5 + (id.charCodeAt(0) % 5) * 0.1).toFixed(1)}
            </span>
            <span className="w-0.5 h-0.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500">
              {(10 + (id.charCodeAt(1) % 40))} ratings
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mb-2">
            {description || "Freshly prepared"}
          </p>

          {/* Price and Add Button Row — fixed min height to prevent layout shift */}
          <div className="flex items-center justify-between mt-auto min-h-[32px]">
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm flex-shrink-0 tracking-tight">
              {currencySymbol}{Number(price || 0).toFixed(0)}
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
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3.5 h-8 text-[10px] uppercase tracking-wider rounded-xl shadow-[0_2px_8px_rgba(16,185,129,0.15)] transition-all active:scale-95 duration-100"
                  >
                    <Plus className="w-3 h-3 mr-0.5 stroke-[2.5]" />
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
                  className="flex items-center gap-1 bg-zinc-900 dark:bg-zinc-100 rounded-xl p-0.5 h-8 min-w-[84px] shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg text-white dark:text-zinc-950 hover:bg-white/10 dark:hover:bg-black/10 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDecrement?.();
                    }}
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </Button>
                  <motion.span
                    key={quantity}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="w-4 text-center font-extrabold text-xs text-white dark:text-zinc-950 flex-shrink-0 font-mono"
                  >
                    {quantity}
                  </motion.span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg text-white dark:text-zinc-950 hover:bg-white/10 dark:hover:bg-black/10 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onIncrement?.();
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
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
