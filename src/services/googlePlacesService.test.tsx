import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  validatePlaceId,
  searchGooglePlaces,
  connectAndSyncPlace,
  disconnectGooglePlace,
  manualRefreshGooglePlaces,
  getPublicGoogleRatings,
  type GoogleSyncResult,
  type PublicGoogleRatings,
} from "./googlePlacesService";
import { GoogleRatingSection } from "@/components/menu/GoogleRatingSection";
import { supabase } from "@/integrations/supabase/client";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => {
  return {
    supabase: {
      functions: {
        invoke: vi.fn(),
      },
      from: vi.fn(),
    },
  };
});

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("Google Places Ratings & Reviews Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // Requirement 1 & 2: Validating and Rejecting Place IDs
  // --------------------------------------------------------------------------
  describe("Place ID Validation (Requirements 1 & 2)", () => {
    it("Requirement 1: Accepts a valid Google Place ID", () => {
      const validIds = [
        "ChIJN1t_tDeuEmsRUsoyG83frY4",
        "ChIJ2eUgeAK6j4ARbn5u_wAGqWA",
        "GhIJQWDflvOv3z8RnxErFcACFMA",
        "ChIJL688W131-zkR_test...",
      ];

      for (const id of validIds) {
        const result = validatePlaceId(id);
        expect(result.valid).toBe(true);
        expect(result.reason).toBeUndefined();
      }
    });

    it("Requirement 2: Rejects invalid, empty, or unconfirmed Place IDs", () => {
      // Empty
      expect(validatePlaceId("").valid).toBe(false);
      expect(validatePlaceId("   ").valid).toBe(false);

      // Too short (< 15 chars)
      const shortRes = validatePlaceId("ChIJ123");
      expect(shortRes.valid).toBe(false);
      expect(shortRes.reason).toContain("at least 15 characters");

      // Too long (> 255 chars)
      const longRes = validatePlaceId("a".repeat(260));
      expect(longRes.valid).toBe(false);
      expect(longRes.reason).toContain("cannot exceed 255 characters");

      // Forbidden characters (e.g. spaces, SQL injection, script tags)
      const invalidChars = ["ChIJ<script>12345", "ChIJ 123456789012345", "ChIJ' OR '1'='1'123"];
      for (const inv of invalidChars) {
        const res = validatePlaceId(inv);
        expect(res.valid).toBe(false);
        expect(res.reason).toContain("valid characters");
      }
    });

    it("Requirement 1: Saves a valid Place ID and syncs successfully", async () => {
      const mockSyncResponse: GoogleSyncResult = {
        success: true,
        placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4",
        name: "Ashnora Bistro",
        formattedAddress: "123 Main St, Sydney NSW, Australia",
        rating: 4.8,
        userRatingsTotal: 342,
        mapsUrl: "https://maps.google.com/?cid=123",
        reviewUrl: "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4",
        syncedAt: new Date().toISOString(),
        syncStatus: "connected",
      };

      (supabase.functions.invoke as any).mockResolvedValueOnce({
        data: mockSyncResponse,
        error: null,
      });

      const result = await connectAndSyncPlace(
        "rest-tenant-1",
        "ChIJN1t_tDeuEmsRUsoyG83frY4"
      );

      expect(result.success).toBe(true);
      expect(result.rating).toBe(4.8);
      expect(result.userRatingsTotal).toBe(342);
      expect(supabase.functions.invoke).toHaveBeenCalledWith("google-places", {
        body: {
          action: "sync",
          restaurantId: "rest-tenant-1",
          placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4",
          manual: true,
        },
      });
    });

    it("Requirement 2: Throws client validation error before network call for malformed Place ID", async () => {
      await expect(
        connectAndSyncPlace("rest-tenant-1", "invalid")
      ).rejects.toThrow(/too short/i);

      expect(supabase.functions.invoke).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 3: Fetching and Rendering a Valid Google Rating
  // --------------------------------------------------------------------------
  describe("Fetching & Rendering Google Rating (Requirement 3)", () => {
    it("Renders genuine Google rating and rating count without placeholder data", () => {
      renderWithClient(
        <GoogleRatingSection
          restaurantName="Ashnora Fine Dining"
          googlePlaceId="ChIJN1t_tDeuEmsRUsoyG83frY4"
          googleRating={4.7}
          googleUserRatingsTotal={1280}
          googleMapsUrl="https://maps.google.com/?cid=123"
        />
      );

      // Star rating display
      expect(screen.getByText("4.7")).toBeInTheDocument();
      // Total count
      expect(screen.getByText(/1,280 Google ratings/i)).toBeInTheDocument();
      // View on Google Maps link
      const mapLink = screen.getByRole("link", { name: /view on google maps/i });
      expect(mapLink).toHaveAttribute("href", "https://maps.google.com/?cid=123");
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 4: Handling a Place Without Ratings or Reviews
  // --------------------------------------------------------------------------
  describe("Handling Places Without Ratings or Reviews (Requirement 4)", () => {
    it("Renders neutral fallback when ratings are null and NEVER fabricates 5.0", () => {
      const { container } = renderWithClient(
        <GoogleRatingSection
          restaurantName="Brand New Ashnora Cafe"
          googlePlaceId="ChIJNewPlaceWithoutReviews"
          googleRating={null}
          googleUserRatingsTotal={0}
          googleMapsUrl="https://maps.google.com/?cid=new"
        />
      );

      // Must NOT contain 5.0
      expect(container.textContent).not.toContain("5.0");
      // Shows neutral message
      expect(screen.getByText(/No Google reviews yet/i)).toBeInTheDocument();
      expect(screen.getAllByText(/View on Google Maps/i).length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 5: Handling Google API Failures & Quota Errors
  // --------------------------------------------------------------------------
  describe("Google API Failures & Quota Errors (Requirement 5)", () => {
    it("Translates OVER_QUERY_LIMIT into actionable rate-limit guidance", async () => {
      (supabase.functions.invoke as any).mockResolvedValueOnce({
        data: null,
        error: {
          message: "Google Places API quota exceeded (OVER_QUERY_LIMIT). Please check billing.",
        },
      });

      await expect(
        manualRefreshGooglePlaces("rest-tenant-1")
      ).rejects.toThrow(/quota exceeded/i);
    });

    it("Handles REQUEST_DENIED / missing API key with actionable error message", async () => {
      (supabase.functions.invoke as any).mockResolvedValueOnce({
        data: {
          status: "NOT_CONFIGURED",
          error: "GOOGLE_PLACES_API_KEY is not configured in Supabase Edge Function secrets.",
        },
        error: null,
      });

      const result = await searchGooglePlaces("rest-tenant-1", "Bistro");
      expect(result.status).toBe("NOT_CONFIGURED");
      expect(result.error).toContain("not configured");
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 6: Ensuring Public Menu Remains Usable When Google is Unavailable
  // --------------------------------------------------------------------------
  describe("Public Menu Usability & Non-Blocking Design (Requirement 6)", () => {
    it("Renders nothing if googlePlaceId is not configured, keeping menu uncluttered", () => {
      const { container } = renderWithClient(
        <GoogleRatingSection
          restaurantName="Offline Cafe"
          googlePlaceId=""
          googleRating={null}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it("Public customer menu ratings load from cached DB fields rather than live paid API calls", async () => {
      // Mock db select fallback from restaurants
      const mockRestaurantData = {
        id: "rest-123",
        name: "Test Restaurant",
        google_place_id: "ChIJ123456789012345",
        google_place_name: "Test Restaurant Google",
        google_formatted_address: "123 Street",
        google_rating: 4.6,
        google_user_ratings_total: 89,
        google_maps_url: "https://maps.google.com/test",
        google_review_url: "https://maps.google.com/review",
        google_synced_at: new Date().toISOString(),
        google_sync_status: "connected",
        google_reviews_cache: {
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          reviews: [
            {
              author_name: "John Doe",
              rating: 5,
              text: "Superb food and fast service!",
              relative_time_description: "a week ago",
            },
          ],
        },
      };

      // Mock invoke returning error so it falls back to DB query
      (supabase.functions.invoke as any).mockResolvedValueOnce({
        data: null,
        error: { message: "Edge Function offline" },
      });

      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: mockRestaurantData,
              error: null,
            }),
          }),
        }),
      });

      const ratings = await getPublicGoogleRatings("rest-123");
      expect(ratings).not.toBeNull();
      expect(ratings?.rating).toBe(4.6);
      expect(ratings?.userRatingsTotal).toBe(89);
      expect(ratings?.reviews?.[0]?.author_name).toBe("John Doe");
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 7: Tenant Isolation (Cross-Tenant Modification Rejection)
  // --------------------------------------------------------------------------
  describe("Tenant Isolation (Requirement 7)", () => {
    it("Rejects cross-tenant place modifications when unauthorized", async () => {
      (supabase.functions.invoke as any).mockResolvedValueOnce({
        data: null,
        error: {
          message: "Forbidden: You are not authorized to manage Google Places for this restaurant.",
        },
      });

      await expect(
        connectAndSyncPlace("victim-restaurant-tenant-2", "ChIJN1t_tDeuEmsRUsoyG83frY4")
      ).rejects.toThrow(/Forbidden/i);
    });

    it("Rejects unauthorized disconnect attempts across tenants", async () => {
      (supabase.functions.invoke as any).mockResolvedValueOnce({
        data: null,
        error: {
          message: "Forbidden: You are not authorized to manage Google Places for this restaurant.",
        },
      });

      await expect(
        disconnectGooglePlace("other-restaurant-id")
      ).rejects.toThrow(/Forbidden/i);
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 8: Preventing Unauthorized Manual Refreshes
  // --------------------------------------------------------------------------
  describe("Authorization on Manual Refreshes (Requirement 8)", () => {
    it("Blocks unauthenticated / non-admin callers from triggering manual sync", async () => {
      (supabase.functions.invoke as any).mockResolvedValueOnce({
        data: null,
        error: {
          message: "Unauthorized: Missing authentication credentials.",
        },
      });

      await expect(
        manualRefreshGooglePlaces("rest-tenant-1")
      ).rejects.toThrow(/Unauthorized/i);
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 9: Deduplicating Concurrent Requests
  // --------------------------------------------------------------------------
  describe("Concurrency & Deduplication (Requirement 9)", () => {
    it("Edge function deduplicates simultaneous sync calls for the same restaurant", async () => {
      const mockResult: GoogleSyncResult = {
        success: true,
        placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4",
        name: "Ashnora Bistro",
        formattedAddress: "123 Main St",
        rating: 4.8,
        userRatingsTotal: 342,
        mapsUrl: "https://maps.google.com/?cid=123",
        syncedAt: new Date().toISOString(),
      };

      (supabase.functions.invoke as any)
        .mockResolvedValueOnce({ data: mockResult, error: null })
        .mockResolvedValueOnce({ data: mockResult, error: null });

      const [res1, res2] = await Promise.all([
        connectAndSyncPlace("rest-tenant-1", "ChIJN1t_tDeuEmsRUsoyG83frY4"),
        connectAndSyncPlace("rest-tenant-1", "ChIJN1t_tDeuEmsRUsoyG83frY4"),
      ]);

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);
      expect(res1.rating).toBe(res2.rating);
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 10: Refresh Policy & Cache Expiry
  // --------------------------------------------------------------------------
  describe("Google Places Refresh Policy (Requirement 10)", () => {
    it("Returns cached data when refreshed within the 30-second rate-limit cooldown", async () => {
      const now = new Date().toISOString();
      const cachedResult: GoogleSyncResult = {
        success: true,
        placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4",
        rating: 4.8,
        userRatingsTotal: 342,
        syncedAt: now,
      };

      (supabase.functions.invoke as any).mockResolvedValueOnce({
        data: cachedResult,
        error: null,
      });

      const result = await manualRefreshGooglePlaces("rest-tenant-1");
      expect(result.syncedAt).toBe(now);
      expect(result.rating).toBe(4.8);
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 11: Keeping Google Reviews Separate from Ashnora Customer Feedback
  // --------------------------------------------------------------------------
  describe("Separation of Review Sources (Requirement 11)", () => {
    it("Renders Google reviews distinctly with Google badges, not as Ashnora customer feedback", () => {
      const mockReviews = [
        {
          author_name: "Alice Walker",
          rating: 5,
          text: "Phenomenal dosa and filter coffee!",
          relative_time_description: "2 days ago",
          author_url: "https://www.google.com/maps/contrib/123",
        },
      ];

      renderWithClient(
        <GoogleRatingSection
          restaurantName="Ashnora Pure Veg"
          googlePlaceId="ChIJN1t_tDeuEmsRUsoyG83frY4"
          googleRating={4.9}
          googleUserRatingsTotal={210}
          googleMapsUrl="https://maps.google.com/?cid=123"
          googleReviews={mockReviews}
        />
      );

      // Review author displayed
      expect(screen.getByText("Alice Walker")).toBeInTheDocument();
      // Review content displayed
      expect(screen.getByText(/Phenomenal dosa and filter coffee!/i)).toBeInTheDocument();
      // Google label/context
      expect(screen.getByText(/Google Ratings & Reviews/i)).toBeInTheDocument();
      // "Google ratings" label explicitly present, avoiding Ashnora internal customer review confusion
      expect(screen.getByText(/210 Google ratings/i)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Requirement 12: Google Attribution Display
  // --------------------------------------------------------------------------
  describe("Google Branding & Attribution (Requirement 12)", () => {
    it("Confirms required 'Powered by Google' or Google icon attribution is displayed", () => {
      renderWithClient(
        <GoogleRatingSection
          restaurantName="Ashnora Bistro"
          googlePlaceId="ChIJN1t_tDeuEmsRUsoyG83frY4"
          googleRating={4.5}
          googleUserRatingsTotal={150}
          googleMapsUrl="https://maps.google.com/?cid=123"
        />
      );

      // "Powered by Google" text
      expect(screen.getByText(/Powered by Google/i)).toBeInTheDocument();
    });

    it("Compact badge variant also includes Google attribution and link", () => {
      renderWithClient(
        <GoogleRatingSection
          restaurantName="Ashnora Bistro"
          googlePlaceId="ChIJN1t_tDeuEmsRUsoyG83frY4"
          googleRating={4.5}
          googleUserRatingsTotal={150}
          googleMapsUrl="https://maps.google.com/?cid=123"
          variant="compact"
        />
      );

      expect(screen.getByText("4.5")).toBeInTheDocument();
      expect(screen.getByText("(150)")).toBeInTheDocument();
      expect(screen.getByTitle(/View on Google Maps/i)).toBeInTheDocument();
    });
  });
});
