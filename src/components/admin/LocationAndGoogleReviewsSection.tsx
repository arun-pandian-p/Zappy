import React, { useState } from "react";
import {
  MapPin,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Loader2,
  Unlink,
  Star,
  Building,
  Globe,
  Navigation,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useGooglePlaceSync,
  useGooglePlaceDisconnect,
  useGooglePlaceRefresh,
} from "@/hooks/useGooglePlaces";
import {
  searchGooglePlaces,
  validatePlaceId,
  type GooglePlaceCandidate,
} from "@/services/googlePlacesService";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export interface LocationSettings {
  name: string;
  address: string;
  country: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  google_place_id: string;
  google_place_name?: string;
  google_formatted_address?: string;
  google_rating?: number | null;
  google_user_ratings_total?: number;
  google_maps_url?: string;
  google_review_url?: string;
  google_synced_at?: string;
  google_sync_status?: string;
  google_sync_error?: string;
}

interface LocationAndGoogleReviewsSectionProps {
  restaurantId: string;
  settings: LocationSettings;
  onChange: (updated: Partial<LocationSettings>) => void;
}

export function LocationAndGoogleReviewsSection({
  restaurantId,
  settings,
  onChange,
}: LocationAndGoogleReviewsSectionProps) {
  const { toast } = useToast();
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<GooglePlaceCandidate[]>([]);
  const [manualPlaceIdInput, setManualPlaceIdInput] = useState("");
  const [notConfigured, setNotConfigured] = useState(false);

  const syncMutation = useGooglePlaceSync(restaurantId);
  const disconnectMutation = useGooglePlaceDisconnect(restaurantId);
  const refreshMutation = useGooglePlaceRefresh(restaurantId);

  // Connection status derivation
  const isConnected = !!settings.google_place_id && settings.google_sync_status !== "not_connected";
  const isError = settings.google_sync_status === "error";
  
  // Calculate if refresh is recommended (> 7 days since last sync)
  const isRefreshRequired = isConnected && settings.google_synced_at && (
    Date.now() - new Date(settings.google_synced_at).getTime() > 7 * 24 * 60 * 60 * 1000
  );

  const getStatusBadge = () => {
    if (isError) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          Sync Error: {settings.google_sync_error || "Unknown"}
        </Badge>
      );
    }
    if (isRefreshRequired) {
      return (
        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Recommended
        </Badge>
      );
    }
    if (isConnected) {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Connected to Google Places
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground gap-1">
        Not Connected
      </Badge>
    );
  };

  const handleOpenSearchDialog = () => {
    const defaultQuery = [settings.name, settings.city || settings.address].filter(Boolean).join(", ");
    setSearchQuery(defaultQuery);
    setSearchError(null);
    setCandidates([]);
    setSearchDialogOpen(true);
  };

  const handleExecuteSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError("Please enter a business name, city, or address to search.");
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const result = await searchGooglePlaces(restaurantId, searchQuery);
      if (result.status === "NOT_CONFIGURED") {
        setNotConfigured(true);
        setSearchError(result.error || "Google Places API key is not configured on the server.");
        return;
      }
      if (result.status === "ZERO_RESULTS" || result.candidates.length === 0) {
        setCandidates([]);
        setSearchError("No businesses found matching this query. Try adding the city or neighborhood.");
        return;
      }
      if (result.error && result.candidates.length === 0) {
        setSearchError(result.error);
        return;
      }
      setCandidates(result.candidates);
    } catch (err: any) {
      setSearchError(err.message || "Search failed.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmCandidate = async (candidate: GooglePlaceCandidate) => {
    try {
      toast({
        title: "Connecting Google Place...",
        description: `Linking ${candidate.name} to this restaurant.`,
      });

      const syncResult = await syncMutation.mutateAsync({
        placeId: candidate.placeId,
        manual: true,
      });

      onChange({
        google_place_id: candidate.placeId,
        google_place_name: syncResult.name || candidate.name,
        google_formatted_address: syncResult.formattedAddress || candidate.formattedAddress,
        google_rating: syncResult.rating ?? candidate.rating,
        google_user_ratings_total: syncResult.userRatingsTotal ?? candidate.userRatingsTotal,
        google_maps_url: syncResult.mapsUrl,
        google_review_url: syncResult.reviewUrl,
        google_synced_at: syncResult.syncedAt,
        google_sync_status: "connected",
        google_sync_error: undefined,
        ...(candidate.location ? {
          latitude: candidate.location.lat,
          longitude: candidate.location.lng,
        } : {}),
      });

      setSearchDialogOpen(false);
      toast({
        title: "Google Business Connected!",
        description: `Successfully linked ${candidate.name} (Rating: ${syncResult.rating ?? candidate.rating ?? "N/A"} / 5)`,
      });
    } catch (err: any) {
      toast({
        title: "Connection Failed",
        description: err.message || "Could not link Google Place ID.",
        variant: "destructive",
      });
    }
  };

  const handleConnectManualPlaceId = async () => {
    const val = manualPlaceIdInput.trim();
    const validation = validatePlaceId(val);
    if (!validation.valid) {
      toast({
        title: "Invalid Place ID",
        description: validation.reason || "Invalid format.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({ title: "Validating Place ID...", description: "Fetching details from Google Places." });
      const syncResult = await syncMutation.mutateAsync({
        placeId: val,
        manual: true,
      });

      onChange({
        google_place_id: val,
        google_place_name: syncResult.name,
        google_formatted_address: syncResult.formattedAddress,
        google_rating: syncResult.rating,
        google_user_ratings_total: syncResult.userRatingsTotal,
        google_maps_url: syncResult.mapsUrl,
        google_review_url: syncResult.reviewUrl,
        google_synced_at: syncResult.syncedAt,
        google_sync_status: "connected",
        google_sync_error: undefined,
      });

      setManualPlaceIdInput("");
      setSearchDialogOpen(false);
      toast({
        title: "Place ID Connected",
        description: `Connected to ${syncResult.name || val}`,
      });
    } catch (err: any) {
      toast({
        title: "Connection Failed",
        description: err.message || "Could not verify Place ID with Google.",
        variant: "destructive",
      });
    }
  };

  const handleManualRefresh = async () => {
    try {
      toast({ title: "Refreshing Google Places Data...", description: "Contacting Google API." });
      const result = await refreshMutation.mutateAsync();
      onChange({
        google_rating: result.rating,
        google_user_ratings_total: result.userRatingsTotal,
        google_synced_at: result.syncedAt,
        google_sync_status: "connected",
        google_sync_error: undefined,
      });
      toast({
        title: "Data Refreshed",
        description: `Latest rating: ${result.rating ?? "N/A"} / 5 (${result.userRatingsTotal ?? 0} reviews)`,
      });
    } catch (err: any) {
      toast({
        title: "Refresh Failed",
        description: err.message || "Could not refresh data.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google Places from this restaurant? Google ratings will no longer appear on your public menu.")) {
      return;
    }

    try {
      await disconnectMutation.mutateAsync();
      onChange({
        google_place_id: "",
        google_place_name: undefined,
        google_formatted_address: undefined,
        google_rating: null,
        google_user_ratings_total: 0,
        google_maps_url: undefined,
        google_review_url: undefined,
        google_synced_at: undefined,
        google_sync_status: "not_connected",
        google_sync_error: undefined,
      });
      toast({
        title: "Disconnected",
        description: "Google Places integration has been removed.",
      });
    } catch (err: any) {
      toast({
        title: "Disconnect Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Location & Google Reviews
            </CardTitle>
            <CardDescription>
              Manage your physical address, coordinates, and verified Google Places rating integration.
            </CardDescription>
          </div>
          <div>{getStatusBadge()}</div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* API Key Not Configured Alert */}
        {notConfigured && (
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold">
              <Info className="w-4 h-4 text-amber-600" />
              Google Places API Key Setup Required
            </div>
            <p>
              To search and sync ratings automatically, set <code className="bg-amber-200/50 dark:bg-amber-900/50 px-1 py-0.5 rounded font-mono">GOOGLE_PLACES_API_KEY</code> in your Supabase Edge Function secrets.
            </p>
          </div>
        )}

        {/* 1. Restaurant Name & Street Address */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-foreground" />
              Restaurant Name
            </Label>
            <Input
              value={settings.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Restaurant name"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Street Address
            </Label>
            <Textarea
              value={settings.address}
              onChange={(e) => onChange({ address: e.target.value })}
              placeholder="e.g. 123 Main Street, Suite 400"
              rows={2}
            />
          </div>
        </div>

        {/* 2. City, State, Country, Postal Code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>City</Label>
            <Input
              value={settings.city}
              onChange={(e) => onChange({ city: e.target.value })}
              placeholder="City"
            />
          </div>
          <div className="space-y-2">
            <Label>State / Province</Label>
            <Input
              value={settings.state}
              onChange={(e) => onChange({ state: e.target.value })}
              placeholder="State"
            />
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Input
              value={settings.country}
              onChange={(e) => onChange({ country: e.target.value })}
              placeholder="Country (e.g. India)"
            />
          </div>
          <div className="space-y-2">
            <Label>Postal Code</Label>
            <Input
              value={settings.postal_code}
              onChange={(e) => onChange({ postal_code: e.target.value })}
              placeholder="Postal Code"
            />
          </div>
        </div>

        {/* 3. Optional Coordinates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Navigation className="w-3.5 h-3.5" /> Latitude (Optional)
            </Label>
            <Input
              type="number"
              step="any"
              value={settings.latitude ?? ""}
              onChange={(e) => onChange({ latitude: e.target.value ? parseFloat(e.target.value) : null })}
              placeholder="e.g. 13.0827"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Navigation className="w-3.5 h-3.5" /> Longitude (Optional)
            </Label>
            <Input
              type="number"
              step="any"
              value={settings.longitude ?? ""}
              onChange={(e) => onChange({ longitude: e.target.value ? parseFloat(e.target.value) : null })}
              placeholder="e.g. 80.2707"
            />
          </div>
        </div>

        <Separator />

        {/* 4. Google Maps Place ID Integration Box */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                  alt="Google"
                  className="w-4 h-4"
                />
                Google Places Rating & Review Sync
              </h4>
              <p className="text-xs text-muted-foreground">
                Connect your official Google Maps business listing to display verified ratings and reviews on the customer menu.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenSearchDialog}
                className="gap-1.5 text-xs h-9"
              >
                <Search className="w-3.5 h-3.5 text-primary" />
                {isConnected ? "Change Business" : "Search & Connect Business"}
              </Button>

              {isConnected && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={refreshMutation.isPending}
                  className="gap-1.5 text-xs h-9"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              )}
            </div>
          </div>

          {/* Connected Business Preview Card */}
          {isConnected ? (
            <div className="rounded-xl border border-border/80 p-4 bg-muted/20 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-sm text-foreground">
                    {settings.google_place_name || settings.name}
                  </h5>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {settings.google_formatted_address || settings.address || "Address verified on Google"}
                  </p>
                  <p className="text-[11px] font-mono text-muted-foreground/80 mt-1">
                    Place ID: {settings.google_place_id}
                  </p>
                </div>

                {/* Rating Preview */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 bg-card p-3 rounded-lg border shrink-0">
                  <div className="flex items-center text-amber-500">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span className="ml-1 text-base font-black text-foreground">
                      {settings.google_rating ? Number(settings.google_rating).toFixed(1) : "N/A"}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {settings.google_user_ratings_total
                      ? `${settings.google_user_ratings_total.toLocaleString()} ratings`
                      : "No ratings yet"}
                  </span>
                </div>
              </div>

              {/* Status & Timestamp */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    Last synced:{" "}
                    {settings.google_synced_at
                      ? `${formatDistanceToNow(new Date(settings.google_synced_at), { addSuffix: true })} (${new Date(settings.google_synced_at).toLocaleDateString()})`
                      : "Just now"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {settings.google_maps_url && (
                    <a
                      href={settings.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      View on Maps
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={disconnectMutation.isPending}
                    className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 px-2"
                  >
                    <Unlink className="w-3 h-3" />
                    Disconnect
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-center space-y-2 bg-muted/10">
              <MapPin className="w-8 h-8 text-muted-foreground/60 mx-auto" />
              <p className="text-sm font-semibold text-foreground">No Google Place Connected</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Search for your business to confirm the Place ID and start showing genuine Google star ratings on your customer menu.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenSearchDialog}
                className="mt-2 text-xs gap-1.5"
              >
                <Search className="w-3.5 h-3.5 text-primary" />
                Find Google Place
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* Interactive Search & Place Selection Modal */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Select & Confirm Google Business
            </DialogTitle>
            <DialogDescription>
              Multiple businesses can have similar names. Confirm your exact location before connecting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 flex-1 overflow-y-auto">
            {/* Search Input */}
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleExecuteSearch()}
                placeholder="Search business name, street, or city..."
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleExecuteSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="gap-1.5"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </Button>
            </div>

            {searchError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{searchError}</span>
              </div>
            )}

            {/* Candidates List */}
            {candidates.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Select your business ({candidates.length} found):
                </p>
                <div className="space-y-2">
                  {candidates.map((cand) => (
                    <div
                      key={cand.placeId}
                      className="p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/50 transition-all flex items-start justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <h6 className="font-bold text-sm text-foreground truncate">{cand.name}</h6>
                        <p className="text-xs text-muted-foreground leading-snug">{cand.formattedAddress}</p>
                        <div className="flex items-center gap-2 pt-1">
                          {cand.rating ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                              <span>{cand.rating.toFixed(1)}</span>
                              <span className="text-muted-foreground font-normal ml-0.5">
                                ({cand.userRatingsTotal} ratings)
                              </span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">No rating on record</span>
                          )}
                          <span className="text-muted-foreground/40 text-xs">·</span>
                          <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[150px]">
                            {cand.placeId}
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        disabled={syncMutation.isPending}
                        onClick={() => handleConfirmCandidate(cand)}
                        className="shrink-0 text-xs gap-1 h-8 rounded-lg"
                      >
                        {syncMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Confirm & Link
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator className="my-2" />

            {/* Manual Place ID Fallback */}
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-semibold text-muted-foreground">
                Or enter Place ID directly (Advanced):
              </Label>
              <div className="flex gap-2">
                <Input
                  value={manualPlaceIdInput}
                  onChange={(e) => setManualPlaceIdInput(e.target.value)}
                  placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4"
                  className="font-mono text-xs flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleConnectManualPlaceId}
                  disabled={!manualPlaceIdInput.trim() || syncMutation.isPending}
                  className="text-xs"
                >
                  Connect ID
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="ghost" onClick={() => setSearchDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
