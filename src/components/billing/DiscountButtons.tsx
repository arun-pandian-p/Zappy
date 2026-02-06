import { motion } from "framer-motion";
import { Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DiscountButtonsProps {
  selectedDiscount: number;
  onSelectDiscount: (discount: number) => void;
  discounts?: number[];
}

export function DiscountButtons({
  selectedDiscount,
  onSelectDiscount,
  discounts = [0, 5, 10, 15, 20],
}: DiscountButtonsProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium flex items-center gap-2">
        <Percent className="w-4 h-4" />
        Quick Discount
      </p>
      <div className="flex flex-wrap gap-2">
        {discounts.map((discount) => (
          <motion.div
            key={discount}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant={selectedDiscount === discount ? "default" : "outline"}
              size="sm"
              className={cn(
                "min-w-14",
                selectedDiscount === discount && "bg-primary"
              )}
              onClick={() => onSelectDiscount(discount)}
            >
              {discount === 0 ? "None" : `${discount}%`}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default DiscountButtons;
