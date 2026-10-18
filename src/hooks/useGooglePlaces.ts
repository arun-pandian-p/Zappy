import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  searchGooglePlaces,
  connectAndSyncPlace,
  disconnectGooglePlace,
  manualRefreshGooglePlaces,
  getPublicGoogleRatings,
  type GooglePlaceCandidate,
  type GoogleSyncResult,
  type PublicGoogleRatings,
} from "@/services/googlePlacesService";

export function useGooglePlaceSearch(restaurantId: string, query: string, enabled = false) {
  return useQuery({
    queryKey: ["google-place-search", restaurantId, query],
    queryFn: () => searchGooglePlaces(restaurantId, query),
    enabled: enabled && !!restaurantId && query.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGooglePlaceSync(restaurantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ placeId, manual = true }: { placeId: string; manual?: boolean }) =>
      connectAndSyncPlace(restaurantId, placeId, manual),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["public-google-ratings", restaurantId] });
    },
  });
}

export function useGooglePlaceDisconnect(restaurantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => disconnectGooglePlace(restaurantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["public-google-ratings", restaurantId] });
    },
  });
}

export function useGooglePlaceRefresh(restaurantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => manualRefreshGooglePlaces(restaurantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["public-google-ratings", restaurantId] });
    },
  });
}

export function usePublicGoogleRating(restaurantId?: string) {
  return useQuery({
    queryKey: ["public-google-ratings", restaurantId],
    queryFn: () => (restaurantId ? getPublicGoogleRatings(restaurantId) : null),
    enabled: !!restaurantId,
    staleTime: 60 * 60 * 1000, // 1 hour client cache
    retry: 1,
  });
}
