import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useValidateCoupon, type Coupon } from "@/hooks/useCoupons";

interface CouponInputProps {
  restaurantId: string;
  orderTotal: number;
  onApply: (coupon: Coupon, discount: number) => void;
  onRemove: () => void;
  appliedCoupon?: Coupon | null;
  appliedDiscount?: number;
}

export function CouponInput({
  restaurantId,
  orderTotal,
  onApply,
  onRemove,
  appliedCoupon,
  appliedDiscount,
}: CouponInputProps) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const validateCoupon = useValidateCoupon(restaurantId);

  const handleApply = async () => {
    if (!code.trim()) return;

    try {
      const result = await validateCoupon.mutateAsync({
        code: code.trim(),
        orderTotal,
      });

      onApply(result.coupon, result.discount);
      toast({
        title: "Coupon Applied!",
        description: `You saved ₹${result.discount.toFixed(2)}`,
      });
      setCode("");
    } catch (error) {
      toast({
        title: "Invalid Coupon",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  if (appliedCoupon) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-between p-3 bg-success/10 border border-success/20 rounded-lg"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
            <Check className="w-4 h-4 text-success" />
          </div>
          <div>
            <p className="font-medium text-sm flex items-center gap-1">
              <Ticket className="w-3 h-3" />
              {appliedCoupon.code}
            </p>
            <p className="text-xs text-success">
              You save ₹{appliedDiscount?.toFixed(2)}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <X className="w-4 h-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Enter coupon code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="pl-9 font-mono"
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
        />
      </div>
      <Button
        onClick={handleApply}
        disabled={!code.trim() || validateCoupon.isPending}
        variant="outline"
      >
        {validateCoupon.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "Apply"
        )}
      </Button>
    </div>
  );
}

export default CouponInput;
