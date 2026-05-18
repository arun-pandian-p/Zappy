import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface CategorySliderProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategorySlider({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategorySliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Helper to map category to an emoji icon
  const getCategoryIcon = (cat: string) => {
    const l = cat.toLowerCase();
    if (l === 'all') return '⊞';
    if (l.includes('chutney')) return '🥣';
    if (l.includes('side')) return '🍱';
    if (l.includes('gravy') || l.includes('curry') || l.includes('sambar')) return '🥘';
    if (l.includes('drink') || l.includes('beverage')) return '🍹';
    if (l.includes('addon') || l.includes('add-on')) return '➕';
    if (l.includes('dessert') || l.includes('sweet')) return '🍰';
    if (l.includes('pizza')) return '🍕';
    if (l.includes('burger')) return '🍔';
    if (l.includes('salad') || l.includes('healthy')) return '🥗';
    if (l.includes('coffee') || l.includes('tea')) return '☕';
    return '🍽️';
  };

  // Scroll selected category into view
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

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto scrollbar-hide py-1 -mx-4 px-4"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {categories.map((category) => {
        const isActive = selectedCategory === category;
        
        return (
          <motion.div
            key={category}
            layout
            data-category={category}
            className="flex-shrink-0"
          >
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelectCategory(category)}
              className="flex flex-col items-center gap-1.5 transition-all outline-none"
            >
              <motion.div 
                animate={isActive ? { scale: 1.08, y: -2 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className={`relative w-16 h-16 rounded-full flex items-center justify-center bg-white shadow-sm border transition-all ${
                  isActive 
                    ? "border-success bg-[#e8f5e9]/60 shadow-md ring-2 ring-success/25" 
                    : "border-border hover:border-primary/30"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeMorphIndicator"
                    className="absolute inset-0 rounded-full bg-success/10 -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                )}
                <span className="text-2xl">{getCategoryIcon(category)}</span>
              </motion.div>
              <span className={`text-[10px] font-bold tracking-tight whitespace-nowrap ${isActive ? "text-success font-extrabold" : "text-muted-foreground"}`}>
                {category}
              </span>
            </motion.button>
          </motion.div>
        );
      })}
    </div>
  );
}
