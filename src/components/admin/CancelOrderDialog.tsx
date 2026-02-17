import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const CANCEL_REASONS = [
  "Out of stock",
  "Customer request",
  "Kitchen issue",
  "Duplicate order",
  "Other",
];

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: number;
}

export function CancelOrderDialog({ open, onOpenChange, orderId, orderNumber }: CancelOrderDialogProps) {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCancel = async () => {
    const finalReason = reason === "Other" ? customReason || "Other" : reason;
    if (!finalReason) {
      toast({ title: "Select a reason", variant: "destructive" });
      return;
    }

    setIsPending(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "cancelled" as const,
          cancel_reason: finalReason,
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", orderId);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Order Cancelled", description: `Order #${orderNumber} has been cancelled.` });
      onOpenChange(false);
      setReason("");
      setCustomReason("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to cancel order.", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-destructive" />
            Cancel Order #{orderNumber}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <RadioGroup value={reason} onValueChange={setReason}>
            {CANCEL_REASONS.map((r) => (
              <div key={r} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border">
                <RadioGroupItem value={r} id={`reason-${r}`} />
                <Label htmlFor={`reason-${r}`} className="cursor-pointer text-sm">{r}</Label>
              </div>
            ))}
          </RadioGroup>
          {reason === "Other" && (
            <Textarea
              placeholder="Describe the reason..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={2}
            />
          )}
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleCancel}
            disabled={isPending || !reason}
          >
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
            Cancel Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
