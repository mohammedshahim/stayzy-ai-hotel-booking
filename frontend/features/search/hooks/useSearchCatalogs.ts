"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { CatalogOption } from "@/features/search/types";

export type SearchCatalogs = {
  amenities: CatalogOption[];
  roomFeatures: CatalogOption[];
  mealPlans: CatalogOption[];
};

const EMPTY_CATALOGS: SearchCatalogs = { amenities: [], roomFeatures: [], mealPlans: [] };

// Amenities/room features/meal plans are real lookup tables (uuid id + name) — SearchState
// stores the ids, this hook supplies the labels. Fetched once here and passed down as props
// so FilterSidebar and ActiveFilterChips don't each independently re-fetch the same 3 endpoints.
export function useSearchCatalogs(): SearchCatalogs {
  const [catalogs, setCatalogs] = useState<SearchCatalogs>(EMPTY_CATALOGS);

  useEffect(() => {
    Promise.all([
      apiClient.get<CatalogOption[]>("/amenities"),
      apiClient.get<CatalogOption[]>("/room-features"),
      apiClient.get<CatalogOption[]>("/meal-plans"),
    ])
      .then(([amenities, roomFeatures, mealPlans]) => {
        setCatalogs({
          amenities: amenities.success ? amenities.data : [],
          roomFeatures: roomFeatures.success ? roomFeatures.data : [],
          mealPlans: mealPlans.success ? mealPlans.data : [],
        });
      })
      .catch((error: unknown) => {
        console.error("[useSearchCatalogs]", error);
      });
  }, []);

  return catalogs;
}
