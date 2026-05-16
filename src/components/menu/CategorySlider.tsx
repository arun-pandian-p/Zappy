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
    if (l.includes('gravy') || l.includes('curry')) return '🍲';
    if (l.includes('drink') || l.includes('beverage')) return '🍹';
    if (l.includes('street')) return '🌮';
    if (l.includes('burger')) return '🍔';
    if (l.includes('dessert') || l.includes('sweet')) return '🍰';
    if (l.includes('pizza')) return '🍕';
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
          >
              <button
                onClick={() => onSelectCategory(category)}
                className={`flex flex-col items-center gap-1.5 transition-all outline-none`}
              >
                <div 
                  className={`w-16 h-16 rounded-full flex items-center justify-center bg-white shadow-sm border transition-all ${
                    isActive 
                      ? "border-success bg-[#e8f5e9] shadow-md ring-2 ring-success/20" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-2xl">{getCategoryIcon(category)}</span>
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${isActive ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                  {category}
                </span>
              </button>
          </motion.div>
        );
      })}
    </div>
  );
}
