import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Star, MessageSquare, AlertCircle, MapPin, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { useGoogleReviews } from "@/hooks/useGoogleReviews";
import { format } from "date-fns";

export function GoogleReviewsManager({ restaurantId }: { restaurantId: string }) {
  const { toast } = useToast();
  
  // Fetch Restaurant Details to get Place ID
  const { data: restaurant, refetch: refetchRestaurant } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  const [mapsUrlInput, setMapsUrlInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Google Reviews using our custom hook
  const placeId = restaurant?.google_place_id;
  const { data: googleData, isLoading: isGoogleLoading, error: googleError, refetch: refetchGoogle } = useGoogleReviews(placeId);

  // Fetch Internal Feedback (1-3 stars)
  const { data: internalFeedback, isLoading: isFeedbackLoading } = useQuery({
    queryKey: ['customer_feedback', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_feedback')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      // If table doesn't exist yet, fallback to empty array gracefully
      if (error && error.code === '42P01') return [];
      if (error) throw error;
      return data || [];
    }
  });

  const connectGooglePlaces = async () => {
    if (!mapsUrlInput) return;
    setIsSaving(true);
    try {
      // Resolve the Place ID from the URL via the Edge Function
      const { data: resolveData, error: resolveError } = await supabase.functions.invoke('google-places', {
        body: { url: mapsUrlInput }
      });

      if (resolveError || resolveData?.error) {
        throw new Error(resolveError?.message || resolveData?.error || "Invalid Google Maps URL. Could not find Place ID.");
      }

      const extractedPlaceId = resolveData.extracted_place_id || resolveData.place_id;
      if (!extractedPlaceId) throw new Error("Could not extract Place ID.");

      const { error } = await supabase
        .from('restaurants')
        .update({ 
          google_place_id: extractedPlaceId,
          google_review_url: `https://search.google.com/local/writereview?placeid=${extractedPlaceId}`,
          google_maps_url: mapsUrlInput
        })
        .eq('id', restaurantId);

      if (error) throw error;
      
      toast({ title: "Setup Complete", description: "Google Places integration enabled successfully!" });
      refetchRestaurant();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const clearPlaceId = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ 
          google_place_id: null,
          google_review_url: null,
          google_maps_url: null
        })
        .eq('id', restaurantId);

      if (error) throw error;
      toast({ title: "Disconnected", description: "Google Places integration removed." });
      setMapsUrlInput("");
      refetchRestaurant();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!restaurant) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Reviews</h2>
          <p className="text-muted-foreground">Manage your Google Reputation and internal feedback.</p>
        </div>
        {placeId && (
          <Button variant="outline" onClick={() => clearPlaceId()} disabled={isSaving} className="rounded-xl">
            Disconnect Google
          </Button>
        )}
      </div>

      {!placeId ? (
        <Card className="border-2 border-dashed bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
              <MapPin className="w-8 h-8 text-blue-500" />
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="text-xl font-bold">Connect Google Reviews</h3>
              <p className="text-sm text-muted-foreground">
                Paste your Google Maps URL to sync your ratings and directly redirect 4-5 star orders to your Google Review page.
              </p>
            </div>
            <div className="flex w-full max-w-md items-center space-x-2 mt-4">
              <Input 
                placeholder="https://www.google.com/maps/place/..." 
                value={mapsUrlInput}
                onChange={(e) => setMapsUrlInput(e.target.value)}
                className="bg-white flex-1"
              />
              <Button onClick={connectGooglePlaces} disabled={!mapsUrlInput || isSaving}>
                {isSaving ? "Connecting..." : "Connect"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-blue-50/50 border-blue-100">
              <CardContent className="p-6 flex flex-col justify-center space-y-2">
                <div className="flex items-center gap-2 text-blue-600">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="font-semibold text-sm uppercase tracking-wider">Google Rating</span>
                </div>
                {isGoogleLoading ? <Loader2 className="w-6 h-6 animate-spin text-blue-500" /> : (
                  <div className="text-4xl font-black text-blue-900">{googleData?.rating || "N/A"}</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-indigo-50/50 border-indigo-100">
              <CardContent className="p-6 flex flex-col justify-center space-y-2">
                <div className="flex items-center gap-2 text-indigo-600">
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-semibold text-sm uppercase tracking-wider">Total Reviews</span>
                </div>
                {isGoogleLoading ? <Loader2 className="w-6 h-6 animate-spin text-indigo-500" /> : (
                  <div className="text-4xl font-black text-indigo-900">{googleData?.user_ratings_total || 0}</div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardContent className="p-6 flex items-center justify-between h-full gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold">Google Actions</h4>
                  <p className="text-sm text-muted-foreground">Direct links to your Google Business presence.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2" onClick={() => window.open(restaurant.google_review_url, "_blank")}>
                    <Star className="w-4 h-4" /> Write Review
                  </Button>
                  <Button className="gap-2" onClick={() => window.open(restaurant.google_maps_url, "_blank")}>
                    <ExternalLink className="w-4 h-4" /> View on Maps
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Google Reviews */}
            <Card className="h-[500px] flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-5 h-5" />
                    Latest Google Reviews
                  </CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => refetchGoogle()} disabled={isGoogleLoading}>
                  <RefreshCw className={`w-4 h-4 ${isGoogleLoading ? 'animate-spin' : ''}`} />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto space-y-4 pr-2">
                {googleError ? (
                  <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm">Could not fetch reviews. Make sure your Place ID is correct and Google Places API is enabled.</p>
                  </div>
                ) : isGoogleLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : googleData?.reviews?.length ? (
                  googleData.reviews.map((review, i) => (
                    <div key={i} className="p-4 border rounded-xl space-y-3 bg-white hover:bg-zinc-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img src={review.profile_photo_url} alt={review.author_name} className="w-8 h-8 rounded-full" />
                          <div>
                            <p className="font-semibold text-sm">{review.author_name}</p>
                            <p className="text-xs text-muted-foreground">{review.relative_time_description}</p>
                          </div>
                        </div>
                        <div className="flex">
                          {[...Array(5)].map((_, idx) => (
                            <Star key={idx} className={`w-3.5 h-3.5 ${idx < review.rating ? "text-amber-400 fill-amber-400" : "text-zinc-200"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-zinc-700 leading-relaxed">{review.text || <span className="italic text-zinc-400">No comment</span>}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">No recent reviews found.</div>
                )}
              </CardContent>
            </Card>

            {/* Internal Feedback Recovery */}
            <Card className="h-[500px] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Internal Feedback (1-3 Stars)
                </CardTitle>
                <CardDescription>
                  These reviews were caught by Zappy and kept off Google.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto space-y-4 pr-2">
                {isFeedbackLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : internalFeedback?.length ? (
                  internalFeedback.map((fb: any, i: number) => (
                    <div key={i} className="p-4 border rounded-xl border-amber-100 bg-amber-50/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-white font-mono text-xs">Order #{fb.order_id?.split('-')[0]}</Badge>
                        <div className="flex">
                          {[...Array(5)].map((_, idx) => (
                            <Star key={idx} className={`w-3.5 h-3.5 ${idx < fb.rating ? "text-amber-500 fill-amber-500" : "text-zinc-200"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm font-medium">{fb.comment || "No comment provided."}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(fb.created_at), "MMM d, yyyy h:mm a")}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">Awesome! No bad reviews recently.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
