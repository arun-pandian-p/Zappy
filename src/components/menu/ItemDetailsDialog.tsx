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
        className="fixed bottom-0 top-auto left-0 right-0 sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] translate-x-0 translate-y-0 w-full sm:max-w-[440px] rounded-t-[32px] sm:rounded-[24px] border-0 max-h-[92dvh] sm:max-h-[92dvh] flex flex-col bg-background overflow-hidden [&>button:last-child]:hidden shadow-[0_-8px_40px_rgba(0,0,0,0.15)] sm:shadow-lg focus:outline-none z-[200] animate-in slide-in-from-bottom duration-300"
      >
        {/* Cinematic Hero Image Container */}
        <div className="relative h-[32dvh] min-h-[220px] max-h-[340px] w-full bg-muted flex-shrink-0 overflow-hidden">
          {/* Mobile Bottom Sheet Swipe Bar Indicator */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-white/35 backdrop-blur-sm z-10 pointer-events-none" />

          <img
            src={item.image_url || "/placeholder.svg"}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          {/* Ambient Cinematic fade-out bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Premium Glass Close Button with standard 44px touch area */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-11 h-11 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full transition-all active:scale-95 z-30 flex items-center justify-center shadow-lg border border-white/10"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges overlay */}
          <div className="absolute top-4 left-4 flex gap-2 z-10">
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

          {/* Dynamic Floating metadata pills */}
          <div className="absolute bottom-4 left-4 right-4 flex gap-2 z-10">
            <Badge variant="secondary" className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm text-foreground text-[10px] px-3 py-1 rounded-full border-0 shadow-sm font-semibold">
              <Clock className="w-3.5 h-3.5 mr-1" />{recipe.prepTime}
            </Badge>
            <Badge variant="secondary" className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm text-foreground text-[10px] px-3 py-1 rounded-full border-0 shadow-sm font-semibold">
              <Flame className="w-3.5 h-3.5 mr-1 text-orange-500" />{recipe.calories}
            </Badge>
          </div>
        </div>

        {/* Scrollable Container — Hidden Scrollbars & Momentum Inertia */}
        <div 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          className="flex-1 overflow-y-auto pb-4 overscroll-contain [&::-webkit-scrollbar]:hidden"
        >
          <div className="p-5 space-y-6 pb-8">

            {/* Title & Description Section */}
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black tracking-tight leading-tight">{item.name}</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground/90">
                {item.description || recipe.description}
              </DialogDescription>
            </div>

            {/* Quick Info Tags */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 bg-muted/65 rounded-full px-3 py-1.5 border border-zinc-200/20">
                <UtensilsCrossed className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold">{recipe.cookingStyle}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-muted/65 rounded-full px-3 py-1.5 border border-zinc-200/20">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-xs font-semibold mr-1">{getSpiceLevelLabel(recipe.spiceLevel)}</span>
                <SpiceMeter level={recipe.spiceLevel} />
              </div>
              {recipe.servingSize && (
                <div className="flex items-center gap-1.5 bg-muted/65 rounded-full px-3 py-1.5 border border-zinc-200/20">
                  <span className="text-xs font-semibold">📦 {recipe.servingSize}</span>
                </div>
              )}
            </div>

            {/* Spacing Partition Row */}
            <div className="flex items-center justify-between py-4 border-t border-b border-dashed border-zinc-200 dark:border-zinc-800">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Base Price</span>
                <span className="text-2xl font-black text-[#008c4a] dark:text-[#10b981]">
                  {currencySymbol}{Number(item.price).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Recipe Details */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="bg-amber-500/10 p-2 rounded-xl">
                  <ChefHat className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-extrabold text-sm tracking-tight text-zinc-900 dark:text-zinc-50">Ingredients & Preparation</h3>
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed pl-0.5">
                {recipe.description}
              </p>

              {/* Recipe Ingredients Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {recipe.ingredients.map((ing, idx) => (
                  <motion.span
                    key={idx}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.04 }}
                    className="inline-flex items-center bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold px-3 py-1.5 rounded-full border border-emerald-200/40 dark:border-emerald-800/20 shadow-sm"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 flex-shrink-0" />
                    {ing}
                  </motion.span>
                ))}
              </div>

              {/* Dynamic Allergy warning flags */}
              {recipe.allergens && recipe.allergens.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 pl-0.5 pt-1">
                  <span className="font-bold">⚠️ Allergen Info:</span>
                  <span className="font-medium">{recipe.allergens.join(", ")}</span>
                </div>
              )}

              {/* Inset Chef Note */}
              <div className="bg-amber-50/70 dark:bg-amber-950/15 rounded-2xl p-4 border border-amber-200/30 dark:border-amber-950/30 shadow-sm mt-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-lg flex-shrink-0">👨‍🍳</span>
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-extrabold text-amber-800 dark:text-amber-400 tracking-wider">Chef's Secret Notes</span>
                    <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed font-medium">{recipe.chefNote}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contextual side-recommendations slider */}
            <div className="pt-2">
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
        </div>

        {/* Sticky safe-area CTA Footer overlay */}
        <div className="flex-shrink-0 border-t bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg p-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] sticky bottom-0 z-[210]">
          <AnimatePresence mode="wait">
            {quantity === 0 ? (
              <motion.div
                key="add-btn"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
              >
                <Button 
                  onClick={onAdd}
                  className="w-full bg-[#008c4a] hover:bg-[#00703b] text-white rounded-2xl h-14 font-extrabold text-base shadow-lg shadow-[#008c4a]/15 gap-2 transition-transform active:scale-[0.98]"
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
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
                {/* Quantity Row Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 bg-muted dark:bg-zinc-900 rounded-2xl px-2 py-1 h-12 border border-zinc-200/20">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl hover:bg-white/80 dark:hover:bg-zinc-800"
                      onClick={onDecrement}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <motion.span
                      key={quantity}
                      initial={{ scale: 1.25, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-8 text-center font-black text-lg text-zinc-900 dark:text-zinc-100"
                    >
                      {quantity}
                    </motion.span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl hover:bg-white/80 dark:hover:bg-zinc-800"
                      onClick={onIncrement}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Subtotal</span>
                    <p className="text-xl font-black text-[#008c4a] dark:text-[#10b981]">
                      {currencySymbol}{(Number(item.price) * quantity).toFixed(0)}
                    </p>
                  </div>
                </div>

                {/* View Cart Button */}
                <Button 
                  onClick={onViewCart || onClose}
                  className="w-full bg-[#008c4a] hover:bg-[#00703b] text-white rounded-2xl h-12 font-extrabold text-sm shadow-md shadow-[#008c4a]/10 gap-2 transition-transform active:scale-[0.98]"
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
