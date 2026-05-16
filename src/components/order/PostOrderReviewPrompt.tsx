import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, X, MessageSquare, AlertCircle, CheckCircle2, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import StarRating from '@/components/feedback/StarRating';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { analyzeReviewSentiment, generateRecoveryPlan, ReviewAIInsight, ReviewRecovery } from '@/services/reviews';

interface PostOrderReviewPromptProps {
  restaurantId: string;
  orderId: string;
  tableId?: string;
  googleReviewUrl?: string | null;
  delayMs?: number;
}

const STORAGE_KEY_PREFIX = 'enterprise_review_shown_';

export const PostOrderReviewPrompt = ({
  restaurantId,
  orderId,
  tableId,
  googleReviewUrl,
  delayMs = 5000,
}: PostOrderReviewPromptProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Ratings
  const [overallRating, setOverallRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [ambianceRating, setAmbianceRating] = useState(0);
  
  const [comment, setComment] = useState('');
  const [step, setStep] = useState<'overall' | 'details' | 'feedback' | 'google' | 'recovery' | 'done'>('overall');
  const [submitting, setSubmitting] = useState(false);
  
  // AI Outputs
  const [aiInsight, setAiInsight] = useState<ReviewAIInsight | null>(null);
  const [recoveryOffer, setRecoveryOffer] = useState<ReviewRecovery | null>(null);

  const { toast } = useToast();
  const storageKey = `${STORAGE_KEY_PREFIX}${orderId}`;

  useEffect(() => {
    setOverallRating(0);
    setFoodRating(0);
    setServiceRating(0);
    setAmbianceRating(0);
    setComment('');
    setStep('overall');
    setIsOpen(false);
    setSubmitting(false);
    setAiInsight(null);
    setRecoveryOffer(null);
  }, [orderId]);

  useEffect(() => {
    if (step === 'done') return;
    
    if (delayMs > 0) {
      const alreadyShown = localStorage.getItem(storageKey);
      if (alreadyShown) return;
    }

    const timer = setTimeout(() => {
      localStorage.setItem(storageKey, 'true');
      setIsOpen(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [orderId, restaurantId, delayMs, storageKey, step]);

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

  const handleSubmitAll = useCallback(async () => {
    if (overallRating === 0) return;
    setSubmitting(true);

    try {
      const reviewId = crypto.randomUUID();
      
      // 1. Analyze Sentiment locally before inserting
      const insight = await analyzeReviewSentiment(overallRating, comment, reviewId, restaurantId);
      setAiInsight(insight);

      // 2. Generate Recovery Plan
      const recovery = await generateRecoveryPlan(insight, overallRating, 0);
      setRecoveryOffer(recovery);

      // 3. Save to enterprise_reviews (Try-catch gracefully if migration not run yet)
      try {
        await supabase.from('enterprise_reviews' as any).insert({
          id: reviewId,
          restaurant_id: restaurantId,
          order_id: orderId,
          table_id: tableId || null,
          overall_rating: overallRating,
          food_rating: foodRating || null,
          service_rating: serviceRating || null,
          ambiance_rating: ambianceRating || null,
          comment: comment.trim() || null,
          redirected_to_google: overallRating >= 4 && !!googleReviewUrl,
          status: insight.fraud_score > 0.8 ? 'pending_moderation' : 'published',
        });
        
        await supabase.from('review_ai_insights' as any).insert(insight);
        
        if (recovery) {
          await supabase.from('review_recoveries' as any).insert(recovery);
        }
      } catch (dbErr) {
         // Graceful fallback to legacy feedback table if enterprise tables don't exist yet
         await supabase.from('feedback').insert({
          restaurant_id: restaurantId,
          order_id: orderId,
          table_id: tableId || null,
          rating: overallRating,
          comment: comment.trim() || null,
          redirected_to_google: overallRating >= 4 && !!googleReviewUrl,
        }).select();
      }

      // 4. Smart Routing
      if (recovery && recovery.action_type === 'coupon_issued') {
        setStep('recovery');
      } else if (overallRating >= 4 && googleReviewUrl) {
        setStep('google');
      } else {
        handleClose();
        toast({ title: insight.suggested_reply || 'Thank you for your feedback! 🙏' });
      }

    } catch (err) {
      toast({ title: 'Error', description: 'Could not save feedback.', variant: 'destructive' });
      handleClose();
    } finally {
      setSubmitting(false);
    }
  }, [overallRating, foodRating, serviceRating, ambianceRating, comment, restaurantId, orderId, tableId, googleReviewUrl, toast]);

  const handleGoogleRedirect = () => {
    if (googleReviewUrl) {
      window.open(googleReviewUrl, '_blank');
    }
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
              {step === 'recovery' && "We are so sorry 😔"}
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

            {/* Step 3: Automated Recovery (Coupons for bad reviews) */}
            {step === 'recovery' && recoveryOffer && (
              <motion.div key="recovery" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 text-center space-y-5">
                <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {aiInsight?.suggested_reply || "We sincerely apologize for your experience. This is not our standard."}
                </p>
                
                {recoveryOffer.action_type === 'coupon_issued' && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-4">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">To make it right</p>
                    <div className="flex items-center justify-center gap-3">
                      <Ticket className="w-6 h-6 text-primary" />
                      <span className="text-2xl font-bold tracking-tight">{recoveryOffer.discount_value}% OFF</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Use code <b>{recoveryOffer.coupon_code}</b> on your next visit.</p>
                  </div>
                )}
                
                <Button className="w-full rounded-xl h-12" onClick={handleClose}>
                  I Understand
                </Button>
              </motion.div>
            )}

            {/* Step 4: Google Review Redirect */}
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
          </AnimatePresence>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default PostOrderReviewPrompt;
