"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";

export type FavoriteHotelIdsResult = {
  favoritedIds: Set<string>;
  isLoading: boolean;
  toggleFavorite: (hotelId: string) => void;
};

// Called once per page (SearchPageContent, HotelDetailsContent) and threaded down as
// props to every card that needs it — same lifting pattern as useSearchCatalogs, so a
// page with many hotel cards doesn't fire one fetch per card.
export function useFavoriteHotelIds(): FavoriteHotelIdsResult {
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<string[]>("/favorites/hotel-ids")
      .then((response) => setFavoritedIds(response.success ? new Set(response.data) : new Set()))
      .catch((error: unknown) => console.error("[useFavoriteHotelIds]", error))
      .finally(() => setIsLoading(false));
  }, []);

  function toggleFavorite(hotelId: string) {
    const wasFavorited = favoritedIds.has(hotelId);

    function applyLocal(favorited: boolean) {
      setFavoritedIds((current) => {
        const next = new Set(current);
        if (favorited) next.add(hotelId);
        else next.delete(hotelId);
        return next;
      });
    }

    applyLocal(!wasFavorited);

    const request = wasFavorited ? apiClient.delete(`/favorites/${hotelId}`) : apiClient.post("/favorites", { hotelId });

    request
      .then((response) => {
        if (!response.success) applyLocal(wasFavorited);
      })
      .catch((error: unknown) => {
        console.error("[useFavoriteHotelIds/toggleFavorite]", error);
        applyLocal(wasFavorited);
      });
  }

  return { favoritedIds, isLoading, toggleFavorite };
}
