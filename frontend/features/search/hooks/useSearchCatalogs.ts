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

// Fetched once and passed down as props so FilterSidebar and ActiveFilterChips don't each re-fetch the same 3 endpoints.
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
