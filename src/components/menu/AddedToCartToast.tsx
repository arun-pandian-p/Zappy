import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface AddedToCartToastProps {
  show: boolean;
  itemName: string;
}

export function AddedToCartToast({ show, itemName }: AddedToCartToastProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed top-20 left-4 right-4 z-50 pointer-events-none"
        >
          <div className="max-w-md mx-auto">
            <div className="bg-success/10 border border-success/20 rounded-xl p-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Added to Cart</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {itemName} has been added to your cart.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
