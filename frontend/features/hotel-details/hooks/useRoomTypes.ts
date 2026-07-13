"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { RoomSelectionSearch, RoomTypeAvailability } from "@/features/hotel-details/types";

export type RoomTypesResult = {
  roomTypes: RoomTypeAvailability[];
  isLoading: boolean;
};

type FetchedData = {
  roomTypes: RoomTypeAvailability[];
  // forQuery is null until the first fetch resolves, so isLoading reads true on mount.
  forQuery: string | null;
};

function serializeSearch(search: RoomSelectionSearch): string {
  const params = new URLSearchParams();
  if (search.checkIn) params.set("checkIn", search.checkIn);
  if (search.checkOut) params.set("checkOut", search.checkOut);
  params.set("adults", String(search.adults));
  params.set("kids", String(search.kids));
  params.set("rooms", String(search.rooms));
  return params.toString();
}

export function useRoomTypes(hotelId: string, search: RoomSelectionSearch): RoomTypesResult {
  const [data, setData] = useState<FetchedData>({ roomTypes: [], forQuery: null });
  const query = serializeSearch(search);

  useEffect(() => {
    const controller = new AbortController();

    apiClient
      .get<RoomTypeAvailability[]>(`/hotels/${hotelId}/room-types?${query}`, { signal: controller.signal })
      .then((response) => setData({ roomTypes: response.success ? response.data : [], forQuery: query }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("[useRoomTypes]", error);
        setData({ roomTypes: [], forQuery: query });
      });

    return () => controller.abort();
  }, [hotelId, query]);

  return { roomTypes: data.roomTypes, isLoading: data.forQuery !== query };
}
