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
          className="fixed bottom-[85px] left-0 right-0 z-40 flex justify-center pointer-events-none"
        >
          {/* Decorative background leaves */}
          <div className="absolute top-1/2 -translate-y-1/2 w-[280px] h-[60px] flex justify-between px-2">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a5d6a7" strokeWidth="1.5" className="opacity-60 -translate-x-4"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a5d6a7" strokeWidth="1.5" className="opacity-60 translate-x-4 scale-x-[-1]"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
          </div>
          
          {/* Pill button */}
          <Button
            onClick={onViewCart}
            className="relative pointer-events-auto bg-[#008c4a] hover:bg-[#00703b] text-white rounded-full h-12 shadow-[0_8px_16px_rgba(0,140,74,0.25)] flex items-center gap-3 px-6 z-10"
          >
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              <span className="font-semibold text-sm">View Cart</span>
            </div>
            <div className="bg-white text-[#008c4a] rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px]">
              {itemCount}
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
