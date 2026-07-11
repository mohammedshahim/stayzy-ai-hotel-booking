"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { FavoriteHotel } from "@/features/favorites/types";

export type FavoritesListResult = {
  favorites: FavoriteHotel[];
  isLoading: boolean;
  removeFavorite: (hotelId: string) => void;
};

export function useFavoritesList(): FavoritesListResult {
  const [favorites, setFavorites] = useState<FavoriteHotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<FavoriteHotel[]>("/favorites")
      .then((response) => setFavorites(response.success ? response.data : []))
      .catch((error: unknown) => console.error("[useFavoritesList]", error))
      .finally(() => setIsLoading(false));
  }, []);

  function removeFavorite(hotelId: string) {
    const removed = favorites.find((favorite) => favorite.id === hotelId);
    setFavorites((current) => current.filter((favorite) => favorite.id !== hotelId));

    apiClient.delete(`/favorites/${hotelId}`).then((response) => {
      if (response.success || !removed) return;
      setFavorites((current) => [...current, removed].sort((a, b) => b.savedAt.localeCompare(a.savedAt)));
    });
  }

  return { favorites, isLoading, removeFavorite };
}
