import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingCartBarProps {
  itemCount: number;
  totalPrice: number;
  currencySymbol?: string;
  onViewCart: () => void;
}

export function FloatingCartBar({
  itemCount,
  totalPrice,
  currencySymbol = "₹",
  onViewCart,
}: FloatingCartBarProps) {
  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-20 left-0 right-0 z-40 px-4 pb-2"
        >
          <Button
            onClick={onViewCart}
            className="w-full bg-success hover:bg-success/90 text-success-foreground rounded-2xl h-14 shadow-xl flex items-center justify-between px-5"
            size="lg"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-bold">
                {itemCount} item{itemCount > 1 ? "s" : ""}
              </span>
            </div>
            <span className="font-bold text-lg">
              {currencySymbol}
              {totalPrice.toFixed(2)} →
            </span>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
