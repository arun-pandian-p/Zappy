import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, Star, MessageSquare, Download, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StarRating from "@/components/feedback/StarRating";
import { checkRateLimit, RATE_LIMITS, getRemainingCooldown } from "@/utils/rateLimiter";

interface CheckoutFlowModalsProps {
  isOpen: boolean;
  restaurantId: string;
  restaurantName: string;
  tableNumber: string;
  tableId?: string;
  seatNumbers?: number[];
  seatSessionId: string;
  sessionOrders: any[];
  sessionInvoice: any;
  currencySymbol: string;
  customerName?: string;
  reviewRequired?: boolean;
  onComplete: (summary: { totalPaid: number; invoiceNumber: string; paymentMethod: string; totalItems: number }) => void;
  isCompleted?: boolean;
  onClose?: () => void;
}

export function CheckoutFlowModals({
  isOpen,
  restaurantId,
  restaurantName,
  tableNumber,
  tableId,
  seatNumbers = [],
  seatSessionId,
  sessionOrders,
  sessionInvoice,
  currencySymbol,
  customerName = "",
  reviewRequired = false,
  onComplete,
  isCompleted = true,
  onClose,
}: CheckoutFlowModalsProps) {
  const [step, setStep] = useState<"receipt" | "review">("receipt");
  const [showItems, setShowItems] = useState(false);
  
  // Review state
  const [overallRating, setOverallRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const { toast } = useToast();

  const totalItems = sessionOrders.reduce(
    (sum, order) => sum + (order.order_items?.reduce((s: number, i: any) => s + (i.quantity || 0), 0) || 0),
    0
  );

  const subtotal = sessionInvoice ? Number(sessionInvoice.subtotal) : sessionOrders.reduce((sum, o) => sum + Number(o.subtotal || 0), 0);
  const discount = sessionInvoice ? Number(sessionInvoice.discount_amount) : 0;
  const taxAndService = sessionInvoice ? (Number(sessionInvoice.tax_amount) + Number(sessionInvoice.service_charge)) : sessionOrders.reduce((sum, o) => sum + Number(o.tax_amount || 0) + Number(o.service_charge || 0), 0);
  const totalPaid = sessionInvoice ? Number(sessionInvoice.total_amount) : sessionOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const invoiceNumber = sessionInvoice?.invoice_number || "N/A";
  const paymentMethod = sessionInvoice?.payment_method || "Counter/Cash";

  const handleDownloadPDF = () => {
    // Standard print flow or mock download
    window.print();
    toast({
      title: "Downloading Receipt",
      description: "Your receipt PDF has been generated successfully.",
    });
  };

  const handleReviewSubmit = async () => {
    if (overallRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!checkRateLimit(`feedback_${restaurantId}`, RATE_LIMITS.FEEDBACK.maxAttempts, RATE_LIMITS.FEEDBACK.windowMs)) {
      const cooldown = getRemainingCooldown(`feedback_${restaurantId}`);
      toast({
        title: "Too many attempts",
        description: `Please wait ${cooldown}s before submitting another review.`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Save feedback to database
      const orderId = sessionOrders[0]?.id || "";
      
      await supabase.from("feedback").insert({
        restaurant_id: restaurantId,
        order_id: orderId || null,
        table_id: tableId || null,
        rating: overallRating,
        comment: comment.trim() || null,
        customer_name: customerName.trim() || null,
      });

      // Save to enterprise_reviews
      const { data: revData } = await supabase.from("enterprise_reviews").insert({
        restaurant_id: restaurantId,
        table_id: tableId || null,
        order_id: orderId || null,
        overall_rating: overallRating,
        comment: comment.trim() || null,
        customer_name: customerName.trim() || null,
        source: "qr",
        status: "published"
      }).select("id").single();

      if (revData?.id) {
        const sentiment = overallRating >= 4 ? "positive" : (overallRating === 3 ? "neutral" : "negative");
        await supabase.from("review_ai_insights").insert({
          review_id: revData.id,
          restaurant_id: restaurantId,
          sentiment,
          is_complaint: overallRating <= 3,
          complaint_categories: overallRating <= 3 ? ["customer_feedback"] : [],
          suggested_reply: overallRating >= 4 ? "Thank you for dining with us!" : "We apologize for the inconvenience."
        });
      }

      toast({
        title: "Thank You!",
        description: "Your review has been submitted.",
      });

      // Trigger completion
      onComplete({
        totalPaid,
        invoiceNumber,
        paymentMethod,
        totalItems,
      });
    } catch (err) {
      console.error("Error submitting review:", err);
      toast({
        title: "Submission Error",
        description: "There was an issue saving your review.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const quickTags = overallRating >= 4
    ? ["Excellent Food", "Super Fast Service", "Friendly Staff", "Luxurious Ambiance"]
    : ["Cold Food", "Slow Service", "Rude Staff", "Wrong Order"];

  const handleTagClick = (tag: string) => {
    if (comment.includes(tag)) {
      setComment(comment.replace(tag, "").trim());
    } else {
      setComment(comment ? `${comment}, ${tag}` : tag);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && onClose) onClose(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none select-none max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white dark:bg-zinc-950">
          <AnimatePresence mode="wait">
            {step === "receipt" ? (
              <motion.div
                key="receipt"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6 space-y-5"
              >
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                    🎉
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                    {isCompleted ? "Bill Paid Successfully" : "Bill Receipt Preview"}
                  </h3>
                  <p className="text-xs text-muted-foreground">Thank you for dining at {restaurantName}</p>
                </div>

                <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-3">
                  <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                    <span>Invoice Number</span>
                    <span className="font-mono text-zinc-950 dark:text-zinc-50">{invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                    <span>Payment Method</span>
                    <span className="capitalize text-zinc-950 dark:text-zinc-50">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                    <span>Table / Seats</span>
                    <span className="text-zinc-950 dark:text-zinc-50">Table {tableNumber} (Seats: {seatNumbers.join(",")})</span>
                  </div>
                  <hr className="border-zinc-100 dark:border-zinc-800" />
                  <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                    <span>Subtotal</span>
                    <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                      <span>Discount</span>
                      <span>-{currencySymbol}{discount.toFixed(2)}</span>
                    </div>
                  )}
                  {taxAndService > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                      <span>Tax & Service</span>
                      <span>{currencySymbol}{taxAndService.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-zinc-950 dark:text-zinc-50 pt-1">
                    <span>Total Paid</span>
                    <span>{currencySymbol}{totalPaid.toFixed(2)}</span>
                  </div>
                </div>

                {/* Collapsible Items List */}
                <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/10">
                  <button
                    onClick={() => setShowItems(!showItems)}
                    className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all"
                  >
                    <span>View Ordered Items ({totalItems})</span>
                    {showItems ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <AnimatePresence>
                    {showItems && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden border-t border-zinc-100 dark:border-zinc-800/80 px-4 py-2 bg-zinc-50/20 dark:bg-zinc-900/10 divide-y divide-zinc-100/50 dark:divide-zinc-800/30 max-h-48 overflow-y-auto"
                      >
                        {sessionOrders.map((order) =>
                          order.order_items?.map((item: any) => (
                            <div key={item.id} className="py-2 flex items-center justify-between text-xs text-muted-foreground font-semibold">
                              <span>{item.quantity}x {item.name}</span>
                              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                {currencySymbol}{(Number(item.price || 0) * (item.quantity || 1)).toFixed(2)}
                              </span>
                            </div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-2xl font-bold text-xs gap-2 border-zinc-200 dark:border-zinc-800"
                    onClick={handleDownloadPDF}
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                  {isCompleted ? (
                    <Button
                      className="flex-1 h-12 rounded-2xl font-black text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10"
                      onClick={() => reviewRequired ? setStep("review") : onComplete({ totalPaid, invoiceNumber, paymentMethod, totalItems })}
                    >
                      {reviewRequired ? "Continue to Review" : "Continue"}
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 h-12 rounded-2xl font-black text-xs bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700"
                      onClick={onClose}
                    >
                      Close Preview
                    </Button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-5"
              >
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold animate-pulse">
                    ⭐
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Rate Your Experience</h3>
                  <p className="text-xs text-muted-foreground">Your feedback helps us improve our service</p>
                </div>

                <div className="flex justify-center py-2">
                  <StarRating value={overallRating} onChange={setOverallRating} size="xl" />
                </div>

                {overallRating > 0 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Quick Tags</span>
                      <div className="flex flex-wrap gap-2">
                        {quickTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant={comment.includes(tag) ? "default" : "secondary"}
                            className="cursor-pointer font-bold py-1 px-3.5 rounded-full text-[10px] hover:bg-primary hover:text-white transition-all duration-150"
                            onClick={() => handleTagClick(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                        <span>Food Quality</span>
                        <StarRating value={foodRating} onChange={setFoodRating} size="sm" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                        <span>Service Quality</span>
                        <StarRating value={serviceRating} onChange={setServiceRating} size="sm" />
                      </div>
                    </div>
                  </div>
                )}

                <Textarea
                  placeholder="Any additional feedback? (Optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="rounded-2xl text-xs bg-zinc-50/50 dark:bg-zinc-900/30 resize-none border-zinc-150 focus:border-primary focus:bg-white dark:focus:bg-zinc-950 transition-all duration-200"
                />

                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full h-12 rounded-2xl font-black text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10"
                    onClick={handleReviewSubmit}
                    disabled={submitting || overallRating === 0}
                  >
                    {submitting ? "Submitting..." : "Submit Review"}
                  </Button>
                  {!reviewRequired && (
                    <Button
                      variant="ghost"
                      className="w-full h-10 rounded-2xl font-bold text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => onComplete({ totalPaid, invoiceNumber, paymentMethod, totalItems })}
                      disabled={submitting}
                    >
                      Skip Review
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
