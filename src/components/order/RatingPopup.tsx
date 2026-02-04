import { useState } from 'react';
import { Star, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateFeedback } from '@/hooks/useFeedback';
import { useToast } from '@/hooks/use-toast';

interface RatingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  tableId?: string;
  orderId?: string;
  googleReviewUrl?: string | null;
}

export const RatingPopup = ({
  isOpen,
  onClose,
  restaurantId,
  tableId,
  orderId,
  googleReviewUrl,
}: RatingPopupProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showGoogleRedirect, setShowGoogleRedirect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createFeedback = useCreateFeedback();
  const { toast } = useToast();

  const handleStarClick = (value: number) => {
    setRating(value);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: 'Please rate your experience',
        description: 'Tap the stars to give a rating.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save feedback to database
      await createFeedback.mutateAsync({
        restaurant_id: restaurantId,
        table_id: tableId || undefined,
        order_id: orderId || undefined,
        rating,
        comment: comment.trim() || undefined,
        redirected_to_google: rating >= 4 && !!googleReviewUrl,
      });

      // If rating is 4 or higher and Google review URL exists, show redirect option
      if (rating >= 4 && googleReviewUrl) {
        setShowGoogleRedirect(true);
      } else {
        toast({
          title: 'Thank you for your feedback!',
          description: 'We appreciate you taking the time to rate us.',
        });
        handleClose();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleReview = () => {
    if (googleReviewUrl) {
      window.open(googleReviewUrl, '_blank');
    }
    toast({
      title: 'Thank you!',
      description: 'We appreciate your support!',
    });
    handleClose();
  };

  const handleSkipGoogle = () => {
    toast({
      title: 'Thank you for your feedback!',
      description: 'We appreciate you taking the time to rate us.',
    });
    handleClose();
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    setShowGoogleRedirect(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {showGoogleRedirect ? 'Thank You! 🎉' : 'How was your experience?'}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!showGoogleRedirect ? (
            <motion.div
              key="rating"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 py-4"
            >
              {/* Star Rating */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <motion.button
                    key={value}
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleStarClick(value)}
                    onMouseEnter={() => setHoveredRating(value)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        value <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </motion.button>
                ))}
              </div>

              {/* Rating Text */}
              <p className="text-center text-muted-foreground">
                {rating === 0 && 'Tap to rate'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent!'}
              </p>

              {/* Comment */}
              <Textarea
                placeholder="Share your thoughts (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="resize-none"
                rows={3}
              />

              {/* Submit Button */}
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="google"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 py-4 text-center"
            >
              <div className="text-6xl">⭐</div>
              <p className="text-muted-foreground">
                We're thrilled you had a great experience! Would you mind sharing your review on Google? It helps us a lot!
              </p>

              <div className="flex flex-col gap-3">
                <Button onClick={handleGoogleReview} className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Leave a Google Review
                </Button>
                <Button variant="ghost" onClick={handleSkipGoogle}>
                  Maybe later
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
