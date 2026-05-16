import { motion } from "framer-motion";
import { Plus, Sparkles, Star, Utensils, GlassWater, IceCreamCone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCartRecommendations, type Recommendation } from "@/services/recommendationService";
import type { MenuItem } from "@/hooks/useMenuItems";

interface RecommendationsSectionProps {
  cartItemNames: string[];
  allMenuItems: MenuItem[];
  onAddItem: (itemId: string) => void;
  currencySymbol?: string;
}

// Type → icon mapping
function TypeIcon({ type }: { type: Recommendation["type"] }) {
  switch (type) {
    case "drink":
      return <GlassWater className="w-3 h-3" />;
    case "dessert":
      return <IceCreamCone className="w-3 h-3" />;
    case "combo":
      return <Star className="w-3 h-3" />;
    default:
      return <Utensils className="w-3 h-3" />;
  }
}

// Add trending icon mapping
function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case "Pairs Perfectly":
      return <Sparkles className="w-3 h-3" />;
    case "Frequently Bought Together":
      return <Plus className="w-3 h-3" />;
    case "Chef Recommended":
      return <Star className="w-3 h-3" />;
    case "Popular Combo":
      return <Utensils className="w-3 h-3" />;
    default:
      return <Sparkles className="w-3 h-3" />;
  }
}

// Type → color mapping
function getTypeColor(type: Recommendation["type"]) {
  switch (type) {
    case "drink":
      return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300";
    case "dessert":
      return "bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300";
    case "combo":
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300";
    default:
      return "bg-primary/5 text-primary";
  }
}

function getTypeLabel(type: Recommendation["type"]) {
  switch (type) {
    case "drink": return "Best Drink";
    case "dessert": return "Sweet Finish";
    case "combo": return "Best Pairing";
    default: return "Add-on";
  }
}

export function RecommendationsSection({
  cartItemNames,
  allMenuItems,
  onAddItem,
  currencySymbol = "₹"
}: RecommendationsSectionProps) {
  const recommendations = getCartRecommendations(
    cartItemNames, 
    allMenuItems.map(i => i.name)
  );

  if (recommendations.length === 0) return null;

  const mainTarget = cartItemNames.length > 0 ? cartItemNames[cartItemNames.length - 1] : "";
  const title = mainTarget ? `Best with ${mainTarget}` : "Recommended for your order";

  return (
    <div className="py-5 border-t border-dashed mt-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-primary/10 p-1.5 rounded-lg">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-sm">{title}</h3>
          <p className="text-[10px] text-muted-foreground">AI-powered smart pairings</p>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div className="flex gap-2.5 overflow-x-auto pb-3 -mx-5 px-5 scrollbar-hide snap-x snap-mandatory">
        {recommendations.map((rec, idx) => {
          // Find matching menu item
          const menuItem = allMenuItems.find(item => 
            item.name.toLowerCase().includes(rec.name.toLowerCase()) ||
            rec.name.toLowerCase().includes(item.name.toLowerCase())
          );

          if (!menuItem) return null;

          const typeColor = getTypeColor(rec.type);

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08, type: "spring", stiffness: 300, damping: 30 }}
              className="flex-shrink-0 w-[150px] bg-card rounded-2xl border shadow-sm overflow-hidden snap-start group hover:shadow-md transition-shadow"
            >
              {/* Food Thumbnail */}
              <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                <img
                  src={menuItem.image_url || "/placeholder.svg"}
                  alt={menuItem.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <Badge className={`absolute top-1.5 left-1.5 text-[8px] px-1.5 py-0 h-4 border-0 rounded-full font-semibold ${typeColor}`}>
                  <CategoryIcon category={rec.category || "Pairs Perfectly"} />
                  <span className="ml-0.5">{rec.relationBadge || getTypeLabel(rec.type)}</span>
                </Badge>
                
                {/* Bestseller / Chef Special Tag */}
                {rec.isBestseller && (
                  <Badge className="absolute bottom-1.5 left-1.5 text-[8px] px-1.5 py-0 h-4 border-0 rounded-full font-bold bg-amber-500 text-white shadow-sm">
                    Bestseller
                  </Badge>
                )}
                {rec.isChefSpecial && !rec.isBestseller && (
                  <Badge className="absolute bottom-1.5 left-1.5 text-[8px] px-1.5 py-0 h-4 border-0 rounded-full font-bold bg-[#008c4a] text-white shadow-sm">
                    Chef Special
                  </Badge>
                )}
              </div>
              
              {/* Content */}
              <div className="p-2.5 space-y-1.5 relative flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold line-clamp-1">{menuItem.name}</h4>
                  
                  {/* AI Explanation / Reason */}
                  <div className="flex items-start gap-1 mt-1">
                    <Sparkles className="w-2.5 h-2.5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[9px] text-muted-foreground line-clamp-2 leading-tight">
                        <span className="font-medium text-foreground/80">{rec.category || "Recommended"}:</span> {rec.reason}
                      </p>
                      {rec.pairingPercentage && (
                        <p className="text-[8px] font-medium text-emerald-600 dark:text-emerald-400">
                          {rec.pairingPercentage}% customers order this together
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 mt-auto border-t border-dashed border-border/50">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#008c4a]">
                      {currencySymbol}{Number(menuItem.price).toFixed(0)}
                    </span>
                    {rec.comboSavings && (
                      <span className="text-[8px] text-primary font-medium">Save {currencySymbol}{rec.comboSavings}</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 rounded-full p-0 bg-[#008c4a]/10 hover:bg-[#008c4a] hover:text-white transition-all duration-200"
                    onClick={() => onAddItem(menuItem.id)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
