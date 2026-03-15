import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import StarRating from '@/components/feedback/StarRating';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PostOrderReviewPromptProps {
  restaurantId: string;
  orderId: string;
  tableId?: string;
  googleReviewUrl?: string | null;
  delayMs?: number;
}

const STORAGE_KEY_PREFIX = 'zappy_review_shown_';

const trackEvent = async (restaurantId: string, eventType: string, data?: Record<string, string | number | boolean>) => {
  try {
    await supabase.from('analytics_events').insert([{
      restaurant_id: restaurantId,
      event_type: eventType,
      event_data: (data || {}) as Record<string, string | number | boolean>,
    }]);
  } catch {
    // silent fail for analytics
  }
};

export const PostOrderReviewPrompt = ({
  restaurantId,
  orderId,
  tableId,
  googleReviewUrl,
  delayMs = 5000,
}: PostOrderReviewPromptProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [step, setStep] = useState<'rating' | 'feedback' | 'google' | 'done'>('rating');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Anti-spam: check localStorage
  const storageKey = `${STORAGE_KEY_PREFIX}${orderId}`;

  // Reset state when orderId changes (new order placed)
  useEffect(() => {
    setRating(0);
    setComment('');
    setStep('rating');
    setIsOpen(false);
    setSubmitting(false);
  }, [orderId]);

  useEffect(() => {
    if (step === 'done') return;
    
    // For immediate triggers (delayMs === 0), skip localStorage check
    if (delayMs > 0) {
      const alreadyShown = localStorage.getItem(storageKey);
      if (alreadyShown) return;
    }

    const timer = setTimeout(() => {
      localStorage.setItem(storageKey, 'true');
      setIsOpen(true);
      trackEvent(restaurantId, 'review_prompt_shown', { order_id: orderId });
    }, delayMs);

    return () => clearTimeout(timer);
  }, [orderId, restaurantId, delayMs, storageKey, step]);

  const handleSubmitRating = useCallback(async () => {
    if (rating === 0) return;
    setSubmitting(true);

    try {
      // Save to feedback table
      await supabase.from('feedback').insert({
        restaurant_id: restaurantId,
        order_id: orderId,
        table_id: tableId || null,
        rating,
        comment: comment.trim() || null,
        redirected_to_google: rating >= 4 && !!googleReviewUrl,
      });

      trackEvent(restaurantId, 'review_submitted', {
        order_id: orderId,
        rating,
        review_type: rating >= 4 ? 'google_redirect' : 'internal_feedback',
      });

      if (rating >= 4 && googleReviewUrl) {
        setStep('google');
      } else if (rating <= 3) {
        setStep('feedback');
      } else {
        handleClose();
        toast({ title: 'Thank you for your feedback! 🙏' });
      }
    } catch {
      toast({ title: 'Error', description: 'Could not save feedback.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [rating, comment, restaurantId, orderId, tableId, googleReviewUrl, toast]);

  const handleFeedbackSubmit = async () => {
    if (!comment.trim()) {
      handleClose();
      toast({ title: 'Thank you for your feedback! 🙏' });
      return;
    }

    setSubmitting(true);
    try {
      // Update the already-inserted feedback row with the comment
      await supabase
        .from('feedback')
        .update({ comment: comment.trim() })
        .eq('order_id', orderId)
        .eq('restaurant_id', restaurantId);

      trackEvent(restaurantId, 'low_rating_feedback', {
        order_id: orderId,
        rating,
      });

      toast({ title: 'Thank you!', description: "We'll work to improve your experience." });
    } catch {
      // silent
    } finally {
      setSubmitting(false);
      handleClose();
    }
  };

  const handleGoogleRedirect = () => {
    if (googleReviewUrl) {
      window.open(googleReviewUrl, '_blank');
    }
    trackEvent(restaurantId, 'google_review_redirect', { order_id: orderId, rating });
    toast({ title: 'Thank you! 🌟', description: 'Your review means a lot to us!' });
    handleClose();
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep('done');
  };

  if (step === 'done') return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {step === 'rating' && 'How was your experience? ⭐'}
            {step === 'feedback' && 'Help us improve 💬'}
            {step === 'google' && "We're thrilled! 🎉"}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Star Rating */}
          {step === 'rating' && (
            <motion.div
              key="rating"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5 py-4"
            >
              <div className="flex flex-col items-center gap-3">
                <StarRating value={rating} onChange={setRating} size="lg" />
                <AnimatePresence mode="wait">
                  {rating > 0 && (
                    <motion.p
                      key={rating}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-muted-foreground"
                    >
                      {rating === 1 && "We're sorry to hear that 😔"}
                      {rating === 2 && "We'll do better 🙏"}
                      {rating === 3 && 'Thanks for your feedback 👍'}
                      {rating === 4 && 'Great to hear! 😊'}
                      {rating === 5 && 'Awesome! You made our day! 🎉'}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={handleClose}
                >
                  Skip
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmitRating}
                  disabled={rating === 0 || submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2a: Internal Feedback (1-3 stars) */}
          {step === 'feedback' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 py-4"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                <p className="text-sm">What could we improve?</p>
              </div>
              <Textarea
                placeholder="Tell us what went wrong so we can make it right..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={handleClose}>
                  Skip
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleFeedbackSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Sending...' : 'Submit Feedback'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2b: Google Review Redirect (4-5 stars) */}
          {step === 'google' && (
            <motion.div
              key="google"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5 py-4 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                className="text-5xl"
              >
                ⭐
              </motion.div>
              <p className="text-sm text-muted-foreground">
                Would you mind sharing your experience on Google? It helps other food lovers discover us!
              </p>
              <div className="flex flex-col gap-3">
                <Button onClick={handleGoogleRedirect} className="w-full gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Leave a Google Review
                </Button>
                <Button variant="ghost" onClick={handleClose}>
                  Maybe Later
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default PostOrderReviewPrompt;
