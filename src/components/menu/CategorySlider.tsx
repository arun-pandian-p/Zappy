import { useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface CategorySliderProps {
  categories: { id: string; name: string; image_url: string | null }[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

// Special prepended discovery categories mapped to emojis
const DISCOVERY_FILTERS = [
  { id: 'trending', name: 'Trending', icon: '🔥' },
  { id: 'chef_special', name: 'Chef Special', icon: '👨‍🍳' },
  { id: 'healthy', name: 'Healthy', icon: '🥗' },
  { id: 'spicy', name: 'Spicy', icon: '🌶️' },
];

export function CategorySlider({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategorySliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Helper to map category to an emoji icon
  const getCategoryIcon = (cat: string) => {
    const l = cat.toLowerCase();
    if (l === "all") return "⊞";
    if (l.includes("chutney")) return "🥣";
    if (l.includes("side")) return "🍱";
    if (
      l.includes("gravy") ||
      l.includes("curry") ||
      l.includes("sambar")
    )
      return "🥘";
    if (l.includes("drink") || l.includes("beverage")) return "🍹";
    if (l.includes("addon") || l.includes("add-on")) return "➕";
    if (l.includes("dessert") || l.includes("sweet")) return "🍰";
    if (l.includes("pizza")) return "🍕";
    if (l.includes("burger")) return "🍔";
    if (l.includes("salad") || l.includes("healthy")) return "🥗";
    if (l.includes("coffee") || l.includes("tea")) return "☕";
    return "🍽️";
  };

  // Scroll selected button into view
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

  // Combine Discovery Filters and Restaurant Categories
  const allBubbles = [
    { id: 'all', name: 'All', image_url: null, isDiscovery: true, icon: '⊞' },
    ...DISCOVERY_FILTERS.map(df => ({ id: df.id, name: df.name, image_url: null, isDiscovery: true, icon: df.icon })),
    ...categories.filter(c => c.name !== 'All').map(c => ({ id: c.id, name: c.name, image_url: c.image_url, isDiscovery: false, icon: null }))
  ];

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto scrollbar-hide py-2 -mx-4 px-4 select-none"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {allBubbles.map((cat) => {
        const isActive = selectedCategory === cat.name;

        return (
          <motion.div
            key={cat.id}
            layout
            data-category={cat.name}
            className="flex-shrink-0"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectCategory(cat.name)}
              className={`relative flex items-center gap-1.5 py-1.5 px-3.5 rounded-full transition-all text-[11px] font-extrabold tracking-tight whitespace-nowrap outline-none border ${
                isActive
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-[0_4px_12px_rgba(5,150,105,0.2)] dark:bg-emerald-500 dark:border-emerald-500 dark:shadow-[0_4px_12px_rgba(16,185,129,0.15)]"
                  : "bg-white/85 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-405 border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-md hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="activeCategoryIndicator"
                  className="absolute inset-0 rounded-full bg-emerald-600/5 dark:bg-emerald-500/5 -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
              {cat.image_url ? (
                <img
                  src={cat.image_url}
                  alt=""
                  className="w-4 h-4 rounded-full object-cover shrink-0 border border-black/5"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="text-sm leading-none shrink-0">
                  {cat.icon || getCategoryIcon(cat.name)}
                </span>
              )}
              <span className="leading-none">{cat.name}</span>
            </motion.button>
          </motion.div>
        );
      })}
    </div>
  );
}
