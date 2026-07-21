"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "stayzy-compare-ids";
export const MIN_COMPARE_HOTELS = 2;
export const MAX_COMPARE_HOTELS = 4;

export type CompareContextValue = {
  ids: string[];
  isSelected: (hotelId: string) => boolean;
  isFull: boolean;
  add: (hotelId: string) => void;
  remove: (hotelId: string) => void;
  clear: () => void;
};

export const CompareContext = createContext<CompareContextValue | null>(null);

function readStoredIds(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

// localStorage holds bare ids only, so consumers always fetch fresh data instead of risking a stale display.
export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Deferred to an effect (not a lazy useState initializer) to avoid a hydration mismatch with SSR's empty markup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIds(readStoredIds());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids, isHydrated]);

  function add(hotelId: string) {
    setIds((current) =>
      current.includes(hotelId) || current.length >= MAX_COMPARE_HOTELS ? current : [...current, hotelId],
    );
  }

  function remove(hotelId: string) {
    setIds((current) => current.filter((id) => id !== hotelId));
  }

  function clear() {
    setIds([]);
  }

  const value: CompareContextValue = {
    ids,
    isSelected: (hotelId) => ids.includes(hotelId),
    isFull: ids.length >= MAX_COMPARE_HOTELS,
    add,
    remove,
    clear,
  };

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}
