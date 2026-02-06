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
            <Button
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectCategory(category)}
              className={`whitespace-nowrap rounded-full font-medium transition-all ${
                isActive
                  ? "bg-success hover:bg-success/90 text-success-foreground shadow-md"
                  : "bg-card border-border hover:bg-muted"
              }`}
            >
              {category}
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}
