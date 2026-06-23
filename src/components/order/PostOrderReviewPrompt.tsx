import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import StarRating from '@/components/feedback/StarRating';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { checkRateLimit, RATE_LIMITS, getRemainingCooldown } from '@/utils/rateLimiter';


interface PostOrderReviewPromptProps {
  restaurantId: string;
  orderId: string;
  tableId?: string;
  googleReviewUrl?: string | null;
  delayMs?: number;
  onClose?: () => void;
  immediate?: boolean;
  seatSessionId?: string;
  seatNumbers?: number[];
  tableNumber?: string;
  onSessionClosed?: () => void;
}

const STORAGE_KEY_PREFIX = 'enterprise_review_shown_';

export const PostOrderReviewPrompt = ({
  restaurantId,
  orderId,
  tableId,
  googleReviewUrl,
  delayMs = 5000,
  onClose,
  immediate = false,
  seatSessionId,
  seatNumbers,
  tableNumber,
  onSessionClosed,
}: PostOrderReviewPromptProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Ratings
  const [overallRating, setOverallRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [ambianceRating, setAmbianceRating] = useState(0);
  
  const [comment, setComment] = useState('');
  const [step, setStep] = useState<'overall' | 'details' | 'feedback' | 'google' | 'thank_you' | 'done'>('overall');
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(65);
  const [invoice, setInvoice] = useState<any>(null);
  
  const { toast } = useToast();
  const storageKey = `${STORAGE_KEY_PREFIX}${orderId}`;

  useEffect(() => {
    if (!isOpen || !orderId) return;
    const fetchInvoice = async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();
      if (data) {
        setInvoice(data);
      }
    };
    fetchInvoice();
  }, [isOpen, orderId]);

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    setOverallRating(0);
    setFoodRating(0);
    setServiceRating(0);
    setAmbianceRating(0);
    setComment('');
    setStep('overall');
    setIsOpen(false);
    setSubmitting(false);
    setCountdown(65);
    setInvoice(null);
  }, [orderId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Already shown/dismissed — do not re-open
    if (localStorage.getItem(storageKey) === 'true' || sessionStorage.getItem(`reviewed_${orderId}`) === 'true') {
      return;
    }

    if (immediate) {
      setIsOpen(true);
      return;
    }

    // Delay then open — DO NOT set localStorage here; only set on close/submit
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, delayMs);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, delayMs, immediate]);

  // Countdown timer for session closing
  useEffect(() => {
    if (step !== 'thank_you') return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  const quickChips = overallRating >= 4 
    ? ["Delicious!", "Fast Service", "Friendly Staff", "Great Ambiance"]
    : ["Cold Food", "Slow Service", "Rude Staff", "Too Spicy", "Small Portions", "Overpriced"];

  const handleChipClick = (chip: string) => {
    if (comment.includes(chip)) {
      setComment(comment.replace(chip, '').trim());
    } else {
      setComment(comment ? `${comment}, ${chip}` : chip);
    }
  };

  const handleNextFromOverall = () => {
    if (overallRating === 0) return;
    // Ask for details, but keep it short
    setStep('details');
  };

  const handleFinalClose = async () => {
    if (step === 'done') return;

    try {
      // 1. Release occupied seats
      if (tableId && seatNumbers && seatNumbers.length > 0) {
        await supabase
          .from('seat_occupancy')
          .update({ status: 'vacant' } as any)
          .eq('table_id', tableId)
          .in('seat_number', seatNumbers);
      }

      // 2. Update table occupancy & status
      if (tableId) {
        const { data: activeSeats } = await supabase
          .from('seat_occupancy')
          .select('id')
          .eq('table_id', tableId)
          .eq('status', 'occupied');

        // Check if table is fully empty now and auto-close session
        if (!activeSeats || activeSeats.length === 0) {
          // Close all active table sessions for this table
          await supabase
            .from('table_sessions')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('table_id', tableId)
            .neq('status', 'completed');

          // Reset table status to Available
          await supabase
            .from('tables')
            .update({ status: 'available' })
            .eq('id', tableId);
        } else {
          // Table still has seats occupied. If it was full, downgrade to occupied.
          const { data: tableData } = await supabase
            .from('tables')
            .select('status, capacity')
            .eq('id', tableId)
            .single();

          if (tableData && tableData.status === 'full' && activeSeats.length < (tableData.capacity || 4)) {
            await supabase
              .from('tables')
              .update({ status: 'occupied' })
              .eq('id', tableId);
          }
        }
      }
    } catch (err) {
      console.error('Error during post-review session teardown:', err);
    }

    // 3. Clear local storage for seat session and table
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`reviewed_${orderId}`, 'true');
      localStorage.setItem(storageKey, 'true');
      if (restaurantId && tableNumber) {
        localStorage.removeItem(`zappy_seat_session_${restaurantId}_${tableNumber}`);
        localStorage.removeItem(`qr_table_${restaurantId}`);
      }
    }

    setIsOpen(false);
    setStep('done');
    
    if (onClose) onClose();
    if (onSessionClosed) onSessionClosed();
  };

  const handleSubmitAll = useCallback(async () => {
    if (overallRating === 0) return;

    // Rate Limit Check
    if (!checkRateLimit(`feedback_${restaurantId}`, RATE_LIMITS.FEEDBACK.maxAttempts, RATE_LIMITS.FEEDBACK.windowMs)) {
      const cooldown = getRemainingCooldown(`feedback_${restaurantId}`);
      toast({
        title: 'Too many requests',
        description: `Please wait ${cooldown}s before submitting another review.`,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      await supabase.from('feedback').insert({
        restaurant_id: restaurantId,
        order_id: orderId,
        table_id: tableId || null,
        rating: overallRating,
        comment: comment.trim() || null,
        redirected_to_google: overallRating >= 4 && !!googleReviewUrl,
      });

      // Save to enterprise_reviews
      const { data: revData, error: revError } = await supabase.from('enterprise_reviews').insert({
        restaurant_id: restaurantId,
        table_id: tableId || null,
        order_id: orderId,
        overall_rating: overallRating,
        comment: comment.trim() || null,
        redirected_to_google: overallRating >= 4 && !!googleReviewUrl,
        source: 'qr',
        status: 'published'
      }).select('id').single();

      if (revError) {
        console.error('Failed to save to enterprise_reviews:', revError);
      } else if (revData?.id) {
        const reviewId = revData.id;
        
        // Save to review_ai_insights
        const sentiment = overallRating >= 4 ? 'positive' : (overallRating === 3 ? 'neutral' : (overallRating === 2 ? 'negative' : 'angry'));
        const { error: aiError } = await supabase.from('review_ai_insights').insert({
          review_id: reviewId,
          restaurant_id: restaurantId,
          sentiment,
          is_complaint: overallRating <= 3,
          complaint_categories: overallRating <= 3 ? ['customer_feedback'] : [],
          positive_highlights: overallRating >= 4 ? ['good_experience'] : [],
          suggested_reply: overallRating >= 4 ? 'Thank you for your review! We look forward to serving you again.' : 'We are sorry to hear that. A manager will look into this immediately.'
        });
        if (aiError) console.error('Failed to save review_ai_insights:', aiError);

        // Save to review_recoveries if rating <= 3
        if (overallRating <= 3) {
          const { error: recError } = await supabase.from('review_recoveries').insert({
            review_id: reviewId,
            restaurant_id: restaurantId,
            status: 'pending',
            action_type: 'apology_sent',
            manager_notes: 'Automated recovery workflow started for low rating.'
          });
          if (recError) console.error('Failed to save review_recoveries:', recError);
        }
      }

      setStep('thank_you');

    } catch (err) {
      toast({ title: 'Error', description: 'Could not save feedback.', variant: 'destructive' });
      handleFinalClose();
    } finally {
      setSubmitting(false);
    }
  }, [overallRating, foodRating, serviceRating, ambianceRating, comment, restaurantId, orderId, tableId, googleReviewUrl, toast]);

  const handleGoogleRedirect = () => {
    if (googleReviewUrl) {
      window.open(googleReviewUrl, '_blank');
    }
    toast({ title: 'Thank you! 🌟', description: 'Your review means a lot to us!' });
    handleFinalClose();
  };

  const handleClose = () => {
    handleFinalClose();
  };

  const isReviewed = typeof window !== 'undefined' && 
    (localStorage.getItem(storageKey) === 'true' || sessionStorage.getItem(`reviewed_${orderId}`) === 'true');

  if (isReviewed || step === 'done') return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none">
        
        <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b text-center relative">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:bg-black/5" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
            <DialogTitle className="text-2xl font-bold tracking-tight">
              {step === 'overall' && 'How was everything?'}
              {step === 'details' && 'Tell us more 💭'}
              {step === 'google' && "We're thrilled! 🎉"}
              {step === 'thank_you' && 'Thank You! ❤️'}
            </DialogTitle>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Overall Rating */}
            {step === 'overall' && (
              <motion.div key="overall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 space-y-6">
                <div className="flex justify-center">
                  <StarRating value={overallRating} onChange={setOverallRating} size="xl" />
                </div>
                
                {overallRating > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <p className="text-lg font-medium text-foreground">
                      {overallRating === 1 && "Terrible"}
                      {overallRating === 2 && "Poor"}
                      {overallRating === 3 && "Average"}
                      {overallRating === 4 && "Great!"}
                      {overallRating === 5 && "Excellent! ❤️"}
                    </p>
                  </motion.div>
                )}

                <Button className="w-full h-12 rounded-xl text-lg font-semibold" onClick={handleNextFromOverall} disabled={overallRating === 0}>
                  Next
                </Button>
              </motion.div>
            )}

            {/* Step 2: Detailed Feedback & Chips */}
            {step === 'details' && (
              <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Food Quality</span>
                    <StarRating value={foodRating} onChange={setFoodRating} size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Service Speed</span>
                    <StarRating value={serviceRating} onChange={setServiceRating} size="sm" />
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-sm font-medium text-muted-foreground">Quick Tags</span>
                  <div className="flex flex-wrap gap-2">
                    {quickChips.map(chip => (
                      <Badge 
                        key={chip} 
                        variant={comment.includes(chip) ? 'default' : 'secondary'}
                        className="cursor-pointer hover:bg-primary/80 transition-colors"
                        onClick={() => handleChipClick(chip)}
                      >
                        {chip}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Textarea
                  placeholder="Any additional comments? (Optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="resize-none rounded-xl bg-muted/50 focus:bg-background transition-colors"
                />

                <div className="flex gap-3">
                  <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setStep('overall')}>Back</Button>
                  <Button className="flex-1 rounded-xl" onClick={handleSubmitAll} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Google Review Redirect */}
            {step === 'google' && (
              <motion.div key="google" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 text-center space-y-6">
                <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-6xl my-4">
                  ⭐
                </motion.div>
                <p className="text-sm text-muted-foreground">
                  Would you mind sharing your experience on Google? It helps other food lovers discover us and supports our staff!
                </p>
                <div className="space-y-3">
                  <Button onClick={handleGoogleRedirect} className="w-full h-12 rounded-xl text-lg font-semibold gap-2 shadow-lg hover:shadow-xl transition-all">
                    <ExternalLink className="w-5 h-5" />
                    Review on Google
                  </Button>
                  <Button variant="ghost" onClick={handleClose} className="w-full rounded-xl">
                    Maybe Later
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Thank You Popup with Countdown */}
            {step === 'thank_you' && (
              <motion.div key="thank_you" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 text-center space-y-6">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-6xl my-4 animate-bounce">
                  🙏
                </motion.div>
                <p className="text-sm text-muted-foreground">
                  Your feedback has been submitted successfully.
                </p>
                
                {invoice && (
                  <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 text-left space-y-2">
                    <h4 className="font-bold text-sm text-slate-800 border-b pb-1">Billing Details</h4>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Invoice Number:</span>
                      <span className="font-mono font-medium">{invoice.invoice_number}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Payment Method:</span>
                      <span className="capitalize font-medium">{invoice.payment_method}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Subtotal:</span>
                      <span>₹{Number(invoice.subtotal).toFixed(2)}</span>
                    </div>
                    {Number(invoice.discount_amount) > 0 && (
                      <div className="flex justify-between text-xs text-green-600">
                        <span>Discount:</span>
                        <span>-₹{Number(invoice.discount_amount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-slate-900 border-t pt-2 mt-2">
                      <span>Total Paid:</span>
                      <span>₹{Number(invoice.total_amount).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-sm font-semibold text-primary">
                    Session will close in {formatCountdown(countdown)}...
                  </p>
                </div>
                <div className="space-y-3">
                  <Button onClick={handleFinalClose} className="w-full h-12 rounded-xl text-lg font-semibold gap-2 shadow-lg hover:shadow-xl transition-all">
                    Logout Session
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default PostOrderReviewPrompt;
