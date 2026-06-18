import { motion } from "framer-motion";
import { Plus, Sparkles, Star, Utensils, GlassWater, IceCreamCone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRecommendations } from "@/hooks/useRecommendations";

interface RecommendationsSectionProps {
  restaurantId?: string;
  cartItemNames: string[];
  allMenuItems?: any[]; // kept for backward compatibility in function signature
  onAddItem: (itemId: string) => void;
  currencySymbol?: string;
}

function getItemType(name: string): "drink" | "dessert" | "combo" | "side" | "addon" {
  const lower = name.toLowerCase();
  if (lower.includes("drink") || lower.includes("soda") || lower.includes("coffee") || lower.includes("tea") || lower.includes("juice") || lower.includes("lassi") || lower.includes("water") || lower.includes("mojito") || lower.includes("shake") || lower.includes("beer") || lower.includes("wine") || lower.includes("cocktail")) {
    return "drink";
  }
  if (lower.includes("ice cream") || lower.includes("sweet") || lower.includes("jamun") || lower.includes("cake") || lower.includes("kesari") || lower.includes("brownie") || lower.includes("pudding") || lower.includes("mousse") || lower.includes("donut")) {
    return "dessert";
  }
  if (lower.includes("combo") || lower.includes("thali") || lower.includes("platter")) {
    return "combo";
  }
  if (lower.includes("fry") || lower.includes("tikka") || lower.includes("kebab") || lower.includes("soup") || lower.includes("salad") || lower.includes("wing") || lower.includes("nugget") || lower.includes("salna") || lower.includes("raita") || lower.includes("sambar") || lower.includes("chutney")) {
    return "side";
  }
  return "addon";
}

function TypeIcon({ type }: { type: string }) {
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

function getTypeColor(type: string) {
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

function getTypeLabel(type: string) {
  switch (type) {
    case "drink": return "Best Drink";
    case "dessert": return "Sweet Finish";
    case "combo": return "Best Pairing";
    default: return "Add-on";
  }
}

export function RecommendationsSection({
  restaurantId,
  cartItemNames,
  onAddItem,
  currencySymbol = "₹"
}: RecommendationsSectionProps) {
  const { data: recommendations = [], isLoading } = useRecommendations(cartItemNames, restaurantId);

  if (isLoading || recommendations.length === 0) return null;

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
          <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            AI-powered smart pairings
          </p>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div className="flex gap-2.5 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
        {recommendations.map((rec, idx) => {
          const menuItem = rec.item;
          const type = getItemType(menuItem.name);
          const typeColor = getTypeColor(type);
          const pairingPercentage = Math.floor(rec.confidence * 100);

          return (
            <motion.div
              key={menuItem.id}
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
                  <span className="ml-0.5">{rec.category || getTypeLabel(type)}</span>
                </Badge>
                
                {/* Bestseller / Chef Special Tag */}
                {menuItem.is_popular && (
                  <Badge className="absolute bottom-1.5 left-1.5 text-[8px] px-1.5 py-0 h-4 border-0 rounded-full font-bold bg-amber-500 text-white shadow-sm">
                    Bestseller
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
                        <span className="font-semibold text-foreground/80">{rec.category}:</span> {rec.reason}
                      </p>
                      {pairingPercentage > 50 && (
                        <p className="text-[8px] font-medium text-emerald-600 dark:text-emerald-400">
                          {pairingPercentage}% match index
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
