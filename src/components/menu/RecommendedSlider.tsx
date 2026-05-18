import { useRef, useState } from "react";
import { Plus, Minus, Heart } from "lucide-react";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { type MenuItem } from "@/hooks/useMenuItems";

interface RecommendedSliderProps {
  items: MenuItem[];
  currencySymbol: string;
  getItemQuantity: (itemId: string) => number;
  onAdd: (item: MenuItem) => void;
  onIncrement: (item: MenuItem) => void;
  onDecrement: (item: MenuItem) => void;
  onItemClick: (item: MenuItem) => void;
}

export function RecommendedSlider({
  items,
  currencySymbol,
  getItemQuantity,
  onAdd,
  onIncrement,
  onDecrement,
  onItemClick,
}: RecommendedSliderProps) {
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });

  return (
    <div className="w-full mb-6">
      <div className="overflow-hidden -mx-4 px-4" ref={emblaRef}>
        <div className="flex select-none gap-4">
          {items.map((item) => (
            <RecommendedCard
              key={item.id}
              item={item}
              currencySymbol={currencySymbol}
              quantity={getItemQuantity(item.id)}
              onAdd={onAdd}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              onClick={() => onItemClick(item)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface RecommendedCardProps {
  item: MenuItem;
  currencySymbol: string;
  quantity: number;
  onAdd: (item: MenuItem) => void;
  onIncrement: (item: MenuItem) => void;
  onDecrement: (item: MenuItem) => void;
  onClick: () => void;
}

function RecommendedCard({
  item,
  currencySymbol,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
  onClick,
}: RecommendedCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div
      className="flex-[0_0_68%] md:flex-[0_0_35%] lg:flex-[0_0_25%] min-w-0 bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col snap-start pb-3.5 group cursor-pointer"
      onClick={onClick}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 rounded-t-3xl">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400">
            🥘
          </div>
        )}

        {/* Dietary / Veg Badge */}
        <span
          className={`absolute top-3 left-3 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full shadow-sm z-10 ${
            item.is_vegetarian
              ? "bg-green-500 text-white border border-green-400"
              : "bg-red-500 text-white border border-red-400"
          }`}
        >
          {item.is_vegetarian ? "VEG" : "NON-VEG"}
        </span>

        {/* Heart / Wishlist button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all z-10 hover:bg-black/60"
          aria-label="Add to wishlist"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isLiked ? "fill-rose-500 stroke-rose-500 animate-pulse" : "stroke-white"
            }`}
          />
        </button>

        {/* Rating / Popular Tag overlay */}
        <div className="absolute bottom-2.5 left-2.5 bg-black/55 backdrop-blur-md text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
          <span>⭐</span>
          <span>{item.is_popular ? "4.8 (120+)" : "4.5 (80+)"}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 line-clamp-1 mb-1 tracking-tight">
            {item.name}
          </h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mb-3 leading-relaxed">
            {item.description || "Freshly cooked to perfection"}
          </p>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between mt-auto">
          <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">
            {currencySymbol}
            {item.price}
          </span>

          {/* Custom Counter / Add trigger */}
          {quantity === 0 ? (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={(e) => {
                e.stopPropagation();
                onAdd(item);
              }}
              className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform"
              aria-label="Add to cart"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </motion.button>
          ) : (
            <div
              className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-full px-1.5 py-0.5 gap-2 shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => onDecrement(item)}
                className="text-zinc-500 dark:text-zinc-400 hover:text-emerald-500 transition-colors font-bold text-xs p-1 active:scale-90"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
              <span className="font-extrabold text-[11px] text-zinc-950 dark:text-zinc-50 min-w-[10px] text-center font-mono">
                {quantity}
              </span>
              <button
                onClick={() => onIncrement(item)}
                className="text-zinc-500 dark:text-zinc-400 hover:text-emerald-500 transition-colors font-bold text-xs p-1 active:scale-90"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
