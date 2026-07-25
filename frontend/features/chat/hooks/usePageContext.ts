"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { PageContext } from "@/features/chat/types";

const HOTEL_PATH = /^\/hotels\/([0-9a-f-]{36})$/i;

const PAGE_LABELS: [RegExp, string][] = [
  [/^\/$/, "the Stayzy homepage"],
  [/^\/search$/, "search results"],
  [/^\/compare$/, "the hotel comparison page"],
  [/^\/favorites$/, "their saved hotels"],
  [/^\/bookings$/, "their bookings"],
  [/^\/bookings\/[^/]+\/review$/, "a review form"],
  [/^\/bookings\/[^/]+$/, "one of their bookings"],
  [/^\/checkout\//, "the checkout page"],
  [/^\/booking-confirmation\//, "a booking confirmation"],
  [/^\/profile$/, "their profile"],
];

function labelFor(path: string): string | undefined {
  return PAGE_LABELS.find(([pattern]) => pattern.test(path))?.[1];
}

export function usePageContext(isActive: boolean): { context: PageContext; label: string } {
  const pathname = usePathname();
  const [namesById, setNamesById] = useState<Record<string, string>>({});

  const hotelId = pathname.match(HOTEL_PATH)?.[1];
  const hotelName = hotelId ? namesById[hotelId] : undefined;

  useEffect(() => {
    if (!hotelId || !isActive || namesById[hotelId]) return;

    let cancelled = false;
    apiClient
      .get<{ name: string }>(`/hotels/${hotelId}`)
      .then((response) => {
        if (cancelled || !response.success) return;
        setNamesById((current) => ({ ...current, [hotelId]: response.data.name }));
      })
      .catch((cause: unknown) => {
        console.error("[usePageContext]", cause);
      });

    return () => {
      cancelled = true;
    };
  }, [hotelId, isActive, namesById]);

  const summary = labelFor(pathname);

  return {
    context: {
      path: pathname,
      ...(hotelId ? { hotelId } : {}),
      ...(hotelName ? { hotelName } : {}),
      ...(summary ? { summary } : {}),
    },
    label: hotelName ?? summary ?? pathname,
  };
}
