import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ExternalLink, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import StarRating from '@/components/feedback/StarRating';

const FeedbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const restaurantId = searchParams.get('r');
  const tableId = searchParams.get('table');
  const orderId = searchParams.get('order');
  const isUuid = (value: string | null) =>
    !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showGoogleRedirect, setShowGoogleRedirect] = useState(false);
  const [restaurant, setRestaurant] = useState<{ name: string; google_review_url: string | null } | null>(null);
  const [resolvedTableId, setResolvedTableId] = useState<string | null>(isUuid(tableId) ? tableId : null);

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!restaurantId) return;
      
      const { data } = await supabase
        .from('restaurants_public')
        .select('name, google_review_url')
        .eq('id', restaurantId)
        .single();
      
      if (data) {
        setRestaurant(data);
      }
    };

    fetchRestaurant();
  }, [restaurantId]);

  useEffect(() => {
    const resolveTable = async () => {
      if (!restaurantId || !tableId || isUuid(tableId)) return;

      const { data } = await supabase
        .from('tables')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('table_number', tableId)
        .eq('is_active', true)
        .maybeSingle();

      setResolvedTableId(data?.id ?? null);
    };

    resolveTable();
  }, [restaurantId, tableId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: 'Please select a rating',
        description: 'Tap the stars to rate your experience',
        variant: 'destructive',
      });
      return;
    }

    if (!restaurantId) {
      toast({
        title: 'Missing restaurant',
        description: 'Open the review link from the restaurant menu.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Save feedback to database
      const { error } = await supabase.from('feedback').insert({
        restaurant_id: restaurantId,
        table_id: resolvedTableId,
        order_id: orderId || null,
        rating,
        comment: comment || null,
        customer_name: customerName || null,
        customer_email: customerEmail || null,
        redirected_to_google: rating >= 4 && !!restaurant?.google_review_url,
      });

      if (error) throw error;

      // Save to enterprise_reviews
      const { data: revData, error: revError } = await supabase.from('enterprise_reviews').insert({
        restaurant_id: restaurantId,
        table_id: resolvedTableId,
        order_id: orderId || null,
        overall_rating: rating,
        comment: comment || null,
        redirected_to_google: rating >= 4 && !!restaurant?.google_review_url,
        source: 'qr',
        status: 'published'
      }).select('id').single();

      if (revError) {
        console.error('Failed to save to enterprise_reviews:', revError);
      } else if (revData?.id) {
        const reviewId = revData.id;
        
        // Save to review_ai_insights
        const sentiment = rating >= 4 ? 'positive' : (rating === 3 ? 'neutral' : (rating === 2 ? 'negative' : 'angry'));
        const { error: aiError } = await supabase.from('review_ai_insights').insert({
          review_id: reviewId,
          restaurant_id: restaurantId,
          sentiment,
          is_complaint: rating <= 3,
          complaint_categories: rating <= 3 ? ['customer_feedback'] : [],
          positive_highlights: rating >= 4 ? ['good_experience'] : [],
          suggested_reply: rating >= 4 ? 'Thank you for your review! We look forward to serving you again.' : 'We are sorry to hear that. A manager will look into this immediately.'
        });
        if (aiError) console.error('Failed to save review_ai_insights:', aiError);

        // Save to review_recoveries if rating <= 3
        if (rating <= 3) {
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

      // If rating is 4+ and Google Review URL exists, show redirect prompt
      if (rating >= 4 && restaurant?.google_review_url) {
        setShowGoogleRedirect(true);
      } else {
        setSubmitted(true);
      }

      toast({
        title: 'Thank you for your feedback!',
        description: rating >= 4 ? 'We appreciate your kind words!' : 'We value your feedback and will work to improve.',
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRedirect = () => {
    if (restaurant?.google_review_url) {
      window.open(restaurant.google_review_url, '_blank');
    }
    setSubmitted(true);
    setShowGoogleRedirect(false);
  };

  const handleSkipGoogle = () => {
    setSubmitted(true);
    setShowGoogleRedirect(false);
  };

  // Thank you screen after submission
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-8 pb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6"
              >
                <CheckCircle className="w-12 h-12 text-green-600" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
              <p className="text-muted-foreground mb-6">
                Your feedback helps us serve you better.
                {rating >= 4 && ' We\'re glad you enjoyed your experience!'}
              </p>
              <Button onClick={() => navigate('/')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Google Review redirect prompt
  if (showGoogleRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-2 border-primary/20">
            <CardHeader className="text-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                className="mx-auto w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4"
              >
                ⭐
              </motion.div>
              <CardTitle className="text-2xl">We're Thrilled! 🎉</CardTitle>
              <CardDescription className="text-base">
                Would you mind sharing your experience on Google? It helps other food lovers discover us!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleGoogleRedirect} 
                className="w-full gap-2"
                size="lg"
              >
                <ExternalLink className="w-5 h-5" />
                Leave a Google Review
              </Button>
              <Button 
                onClick={handleSkipGoogle} 
                variant="ghost" 
                className="w-full"
              >
                Maybe Later
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Main feedback form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-2">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">
                {restaurant?.name ? `How was ${restaurant.name}?` : 'How was your experience?'}
              </CardTitle>
              <CardDescription className="mt-2">
                Your feedback helps us improve
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Star Rating */}
              <div className="flex flex-col items-center space-y-3">
                <Label className="text-base">Rate your experience</Label>
                <StarRating value={rating} onChange={setRating} />
                <AnimatePresence mode="wait">
                  {rating > 0 && (
                    <motion.p
                      key={rating}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="text-sm text-muted-foreground"
                    >
                      {rating === 1 && 'We\'re sorry to hear that 😔'}
                      {rating === 2 && 'We\'ll do better 🙏'}
                      {rating === 3 && 'Thanks for your feedback 👍'}
                      {rating === 4 && 'Great to hear! 😊'}
                      {rating === 5 && 'Awesome! You made our day! 🎉'}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Comment - show more fields for lower ratings */}
              <AnimatePresence>
                {rating > 0 && rating < 4 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="comment">What could we improve?</Label>
                      <Textarea
                        id="comment"
                        placeholder="Tell us what went wrong so we can make it right..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name (optional)</Label>
                        <Input
                          id="name"
                          placeholder="Your name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email (optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@email.com"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Comment for high ratings - just optional comment */}
              <AnimatePresence>
                {rating >= 4 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="comment">Any additional comments? (optional)</Label>
                    <Textarea
                      id="comment"
                      placeholder="Share what you loved about your experience..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={2}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || rating === 0}
              >
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                className="text-sm"
                onClick={() => navigate('/')}
              >
                ← Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default FeedbackPage;
