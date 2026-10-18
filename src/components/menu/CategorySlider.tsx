import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  UtensilsCrossed,
  Coffee,
  Plus,
  Cake,
  Pizza,
  Sandwich,
  Leaf,
  Sparkles,
  Utensils,
} from "lucide-react";

interface CategorySliderProps {
  categories: { id: string; name: string; image_url: string | null }[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategorySlider({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategorySliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Helper to map category name to a professional Lucide icon
  const renderCategoryIcon = (catName: string, isActive: boolean) => {
    const l = catName.trim().toLowerCase();
    const iconClass = `w-4 h-4 shrink-0 transition-colors ${
      isActive
        ? "text-white"
        : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200"
    }`;

    if (l === "all") return <LayoutGrid className={iconClass} />;
    if (l.includes("briyani") || l.includes("biryani") || l.includes("rice")) {
      return <UtensilsCrossed className={iconClass} />;
    }
    if (
      l.includes("soup") ||
      l.includes("curry") ||
      l.includes("gravy") ||
      l.includes("sambar") ||
      l.includes("side") ||
      l.includes("chutney")
    ) {
      return <UtensilsCrossed className={iconClass} />;
    }
    if (
      l.includes("juice") ||
      l.includes("drink") ||
      l.includes("beverage") ||
      l.includes("shake") ||
      l.includes("smoothie") ||
      l.includes("coffee") ||
      l.includes("tea")
    ) {
      return <Coffee className={iconClass} />;
    }
    if (l.includes("starter") || l.includes("appetizer") || l.includes("snack")) {
      return <Sparkles className={iconClass} />;
    }
    if (l.includes("dessert") || l.includes("sweet") || l.includes("ice cream") || l.includes("cake")) {
      return <Cake className={iconClass} />;
    }
    if (l.includes("pizza")) {
      return <Pizza className={iconClass} />;
    }
    if (l.includes("burger") || l.includes("sandwich")) {
      return <Sandwich className={iconClass} />;
    }
    if (l.includes("salad") || l.includes("healthy") || l.includes("veg")) {
      return <Leaf className={iconClass} />;
    }
    if (l.includes("addon") || l.includes("add-on")) {
      return <Plus className={iconClass} />;
    }
    return <Utensils className={iconClass} />;
  };

  // Scroll selected button into view smoothly
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const selectedButton = container.querySelector(
      `[data-category="${selectedCategory}"]`
    ) as HTMLElement;

    if (selectedButton) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = selectedButton.getBoundingClientRect();

      const scrollLeft =
        buttonRect.left -
        containerRect.left -
        containerRect.width / 2 +
        buttonRect.width / 2 +
        container.scrollLeft;

      container.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      });
    }
  }, [selectedCategory]);

  // Clean admin menu categories: strictly exclude "Uncategorized" and "All" duplicates
  const adminCategories = categories.filter((c) => {
    if (!c.name) return false;
    const normalized = c.name.trim().toLowerCase();
    return normalized !== "all" && normalized !== "uncategorized";
  });

  // Only "All" followed by the restaurant's actual admin menu categories
  const allBubbles = [
    { id: "all", name: "All", image_url: null },
    ...adminCategories,
  ];

  return (
    <div
      ref={scrollRef}
      className="flex items-center gap-2.5 overflow-x-auto scrollbar-none py-2.5 -mx-4 px-4 select-none scroll-smooth touch-pan-x"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
    >
      {allBubbles.map((cat) => {
        const isActive =
          selectedCategory.trim().toLowerCase() === cat.name.trim().toLowerCase();

        return (
          <div
            key={cat.id}
            data-category={cat.name}
            className="shrink-0"
          >
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelectCategory(cat.name)}
              className={`group relative h-10 px-4 rounded-full transition-all duration-200 inline-flex items-center justify-center gap-2 text-xs font-bold tracking-tight whitespace-nowrap outline-none border shrink-0 ${
                isActive
                  ? "bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500 shadow-[0_4px_14px_rgba(5,150,105,0.25)]"
                  : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
              }`}
            >
              {cat.image_url ? (
                <img
                  src={cat.image_url}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover shrink-0 border border-black/10 dark:border-white/10"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="shrink-0 flex items-center justify-center">
                  {renderCategoryIcon(cat.name, isActive)}
                </span>
              )}
              <span className="leading-none capitalize">{cat.name}</span>
            </motion.button>
          </div>
        );
      })}
    </div>
  );
}
