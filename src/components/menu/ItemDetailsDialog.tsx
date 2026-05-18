import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, Minus, Heart, X, Clock, Flame, ChefHat, 
  Leaf, Drumstick, Star, ShoppingBag, ArrowRight,
  UtensilsCrossed, Sparkles
} from "lucide-react";
import { RecommendationsSection } from "./RecommendationsSection";
import { getRecipeInfo, getSpiceLevelLabel, getSpiceLevelEmoji } from "@/services/recipeService";
import type { MenuItem } from "@/hooks/useMenuItems";

interface ItemDetailsDialogProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  quantity: number;
  allMenuItems: MenuItem[];
  currencySymbol?: string;
  onViewCart?: () => void;
}

// Spice dots indicator
function SpiceMeter({ level }: { level: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full transition-colors ${
            i <= level
              ? level <= 2 ? "bg-green-500" : level <= 3 ? "bg-orange-500" : "bg-red-500"
              : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

export function ItemDetailsDialog({
  item,
  isOpen,
  onClose,
  onAdd,
  onIncrement,
  onDecrement,
  quantity,
  allMenuItems,
  currencySymbol = "₹",
  onViewCart,
}: ItemDetailsDialogProps) {
  if (!item) return null;

  const recipe = useMemo(() => getRecipeInfo(item.name), [item.name]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="fixed bottom-0 top-auto left-0 right-0 sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] translate-x-0 translate-y-0 w-full sm:max-w-[440px] rounded-t-[32px] sm:rounded-[24px] border-0 max-h-[88vh] sm:max-h-[92vh] flex flex-col bg-background overflow-hidden [&>button:last-child]:hidden shadow-[0_-8px_40px_rgba(0,0,0,0.15)] sm:shadow-lg focus:outline-none z-50 animate-in slide-in-from-bottom duration-300"
      >
        {/* Hero Image Container - capped to prevent stretching */}
        <div className="relative h-[30vh] min-h-[200px] max-h-[300px] w-full bg-muted flex-shrink-0 overflow-hidden">
          {/* Mobile Bottom Sheet Swipe Bar */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-white/40 backdrop-blur-sm z-10" />

          <img
            src={item.image_url || "/placeholder.svg"}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          
          {/* Custom Close button */}
          <button 
            onClick={onClose}
            className="absolute top-5 right-4 bg-black/45 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/60 transition-transform active:scale-95 z-20 flex items-center justify-center"
            aria-label="Close details"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badges overlay */}
          <div className="absolute top-5 left-4 flex gap-2 z-10">
            {item.is_vegetarian !== null && (
              <Badge className={`border-0 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-md ${
                item.is_vegetarian 
                  ? "bg-green-600/90 backdrop-blur-sm" 
                  : "bg-red-600/90 backdrop-blur-sm"
              }`}>
                {item.is_vegetarian ? (
                  <><Leaf className="w-3 h-3 mr-1" />Veg</>
                ) : (
                  <><Drumstick className="w-3 h-3 mr-1" />Non-Veg</>
                )}
              </Badge>
            )}
            {item.is_popular && (
              <Badge className="bg-amber-500/90 backdrop-blur-sm border-0 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-md">
                <Star className="w-3 h-3 mr-1 fill-current" />Bestseller
              </Badge>
            )}
          </div>

          {/* Bottom info pills */}
          <div className="absolute bottom-3 left-3 right-3 flex gap-2 z-10">
            <Badge variant="secondary" className="bg-white/95 backdrop-blur-sm text-foreground text-[10px] px-2.5 py-1 rounded-full border-0 shadow-sm font-semibold">
              <Clock className="w-3 h-3 mr-1" />{recipe.prepTime}
            </Badge>
            <Badge variant="secondary" className="bg-white/95 backdrop-blur-sm text-foreground text-[10px] px-2.5 py-1 rounded-full border-0 shadow-sm font-semibold">
              <Flame className="w-3 h-3 mr-1" />{recipe.calories}
            </Badge>
          </div>
        </div>

        {/* Scrollable Content Container - standard flex-1 overflow-y-auto to fix ScrollArea layout crashes */}
        <div className="flex-1 overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-slate-200">
          <div className="p-5 space-y-5 pb-6">

            {/* Title & Description */}
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black tracking-tight">{item.name}</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                {item.description || recipe.description}
              </DialogDescription>
            </div>

            {/* Quick Info Pills */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 bg-muted/60 rounded-full px-3 py-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">{recipe.cookingStyle}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-muted/60 rounded-full px-3 py-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-xs font-medium">{getSpiceLevelLabel(recipe.spiceLevel)}</span>
                <SpiceMeter level={recipe.spiceLevel} />
              </div>
              {recipe.servingSize && (
                <div className="flex items-center gap-1.5 bg-muted/60 rounded-full px-3 py-1.5">
                  <span className="text-xs font-medium">📦 {recipe.servingSize}</span>
                </div>
              )}
            </div>

            {/* Price Row */}
            <div className="flex items-center justify-between py-3 border-t border-b border-dashed">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Price</span>
                <span className="text-2xl font-black text-[#008c4a]">
                  {currencySymbol}{Number(item.price).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Recipe Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="bg-amber-500/10 p-1.5 rounded-lg">
                  <ChefHat className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="font-bold text-sm">Recipe & Ingredients</h3>
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed pl-0.5">
                {recipe.description}
              </p>

              {/* Ingredients Grid */}
              <div className="flex flex-wrap gap-1.5">
                {recipe.ingredients.map((ing, idx) => (
                  <motion.span
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="inline-flex items-center bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 text-[11px] font-medium px-2.5 py-1 rounded-full border border-green-200/50 dark:border-green-800/30"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 flex-shrink-0" />
                    {ing}
                  </motion.span>
                ))}
              </div>

              {/* Allergens */}
              {recipe.allergens && recipe.allergens.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                  <span className="font-semibold">⚠️ Allergens:</span>
                  <span>{recipe.allergens.join(", ")}</span>
                </div>
              )}

              {/* Chef Note */}
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 border border-amber-200/30 dark:border-amber-800/20">
                <div className="flex items-start gap-2">
                  <span className="text-base flex-shrink-0">👨‍🍳</span>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wide">Chef's Note</span>
                    <p className="text-xs text-amber-900 dark:text-amber-300 mt-0.5 leading-relaxed">{recipe.chefNote}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Intelligent Recommendations */}
            <RecommendationsSection 
              cartItemNames={[item.name]}
              allMenuItems={allMenuItems}
              onAddItem={(id) => {
                onAdd(); 
              }}
              currencySymbol={currencySymbol}
            />
          </div>
        </div>

        {/* Glassmorphic Sticky Bottom CTA - respects safe area on newer mobile screen heights */}
        <div className="flex-shrink-0 border-t bg-white/95 backdrop-blur-md p-4 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.05)] sticky bottom-0 z-30">
          <AnimatePresence mode="wait">
            {quantity === 0 ? (
              <motion.div
                key="add-btn"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Button 
                  onClick={onAdd}
                  className="w-full bg-[#008c4a] hover:bg-[#00703b] text-white rounded-2xl h-14 font-bold text-base shadow-lg shadow-[#008c4a]/20 gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Add to Cart — {currencySymbol}{Number(item.price).toFixed(0)}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="qty-controls"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                {/* Quantity row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 bg-muted rounded-2xl px-2 py-1 h-12">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl hover:bg-white/80 dark:hover:bg-white/10"
                      onClick={onDecrement}
                    >
                      <Minus className="w-5 h-5" />
                    </Button>
                    <motion.span
                      key={quantity}
                      initial={{ scale: 1.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-8 text-center font-black text-lg"
                    >
                      {quantity}
                    </motion.span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl hover:bg-white/80 dark:hover:bg-white/10"
                      onClick={onIncrement}
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Total</span>
                    <p className="text-lg font-black text-[#008c4a]">
                      {currencySymbol}{(Number(item.price) * quantity).toFixed(0)}
                    </p>
                  </div>
                </div>

                {/* View Cart button */}
                <Button 
                  onClick={onViewCart || onClose}
                  className="w-full bg-[#008c4a] hover:bg-[#00703b] text-white rounded-2xl h-12 font-bold text-sm shadow-lg shadow-[#008c4a]/20 gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  View Cart
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
