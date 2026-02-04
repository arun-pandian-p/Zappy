import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Star,
  Download,
  Filter,
  Search,
  MessageSquare,
  TrendingUp,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useFeedback } from "@/hooks/useFeedback";

interface FeedbackManagerProps {
  restaurantId: string;
  googleReviewUrl?: string;
}

export function FeedbackManager({ restaurantId, googleReviewUrl }: FeedbackManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  const { data: feedback = [], isLoading } = useFeedback(restaurantId);

  const filteredFeedback = useMemo(() => {
    return feedback.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRating =
        ratingFilter === "all" || item.rating === parseInt(ratingFilter);

      return matchesSearch && matchesRating;
    });
  }, [feedback, searchQuery, ratingFilter]);

  const stats = useMemo(() => {
    if (feedback.length === 0) return null;

    const totalRating = feedback.reduce((sum, f) => sum + f.rating, 0);
    const avgRating = totalRating / feedback.length;

    const distribution = [1, 2, 3, 4, 5].map((rating) => {
      const count = feedback.filter((f) => f.rating === rating).length;
      return {
        rating,
        count,
        percentage: (count / feedback.length) * 100,
      };
    });

    const googleRedirects = feedback.filter((f) => f.redirected_to_google).length;

    return { avgRating, distribution, googleRedirects, total: feedback.length };
  }, [feedback]);

  const exportCSV = () => {
    const headers = ["Date", "Customer", "Rating", "Comment", "Google Redirect"];
    const rows = filteredFeedback.map((item) => [
      item.created_at ? format(new Date(item.created_at), "yyyy-MM-dd HH:mm") : "",
      item.customer_name || "Anonymous",
      item.rating,
      `"${(item.comment || "").replace(/"/g, '""')}"`,
      item.redirected_to_google ? "Yes" : "No",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                  <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-6 h-6 fill-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Reviews</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <MessageSquare className="w-6 h-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Google Redirects</p>
                  <p className="text-2xl font-bold">{stats.googleRedirects}</p>
                </div>
                <ExternalLink className="w-6 h-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">5 Star Reviews</p>
                  <p className="text-2xl font-bold">
                    {stats.distribution.find((d) => d.rating === 5)?.count || 0}
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rating Distribution */}
      {stats && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...stats.distribution].reverse().map((item) => (
                <div key={item.rating} className="flex items-center gap-3">
                  <span className="w-8 text-sm font-medium flex items-center gap-1">
                    {item.rating}
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </span>
                  <Progress value={item.percentage} className="flex-1 h-2" />
                  <span className="w-12 text-sm text-muted-foreground text-right">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search comments or customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Customer Feedback ({filteredFeedback.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No feedback found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFeedback.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="font-semibold text-sm">
                          {(item.customer_name || "A")[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {item.customer_name || "Anonymous"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.created_at
                            ? format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")
                            : "Unknown date"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(item.rating)}
                      {item.redirected_to_google && (
                        <Badge variant="outline" className="text-xs">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Google
                        </Badge>
                      )}
                    </div>
                  </div>
                  {item.comment && (
                    <p className="text-sm text-muted-foreground mt-3">
                      {item.comment}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default FeedbackManager;
