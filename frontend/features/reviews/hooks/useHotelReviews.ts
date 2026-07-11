"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { HotelReviewsResult, Review } from "@/features/hotel-details/types";

const PAGE_SIZE = 5;

type State = {
  averageRating: number;
  reviewCount: number;
  breakdown: HotelReviewsResult["breakdown"] | null;
  items: Review[];
  page: number;
  totalPages: number;
  // The id this data was fetched for — null until the first fetch resolves, so
  // isLoading below reads true on mount instead of matching an accidental empty string.
  forId: string | null;
};

const EMPTY_STATE: State = {
  averageRating: 0,
  reviewCount: 0,
  breakdown: null,
  items: [],
  page: 0,
  totalPages: 0,
  forId: null,
};

export type HotelReviewsResultState = {
  averageRating: number;
  reviewCount: number;
  breakdown: HotelReviewsResult["breakdown"] | null;
  items: Review[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
};

export function useHotelReviews(hotelId: string): HotelReviewsResultState {
  const [state, setState] = useState<State>(EMPTY_STATE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    apiClient
      .get<HotelReviewsResult>(`/hotels/${hotelId}/reviews?page=1&pageSize=${PAGE_SIZE}`)
      .then((response) => {
        if (!response.success) {
          setState({ ...EMPTY_STATE, forId: hotelId });
          return;
        }
        setState({
          averageRating: response.data.averageRating,
          reviewCount: response.data.reviewCount,
          breakdown: response.data.breakdown,
          items: response.data.reviews.data,
          page: response.data.reviews.page,
          totalPages: response.data.reviews.totalPages,
          forId: hotelId,
        });
      })
      .catch((error: unknown) => {
        console.error("[useHotelReviews]", error);
        setState({ ...EMPTY_STATE, forId: hotelId });
      });
  }, [hotelId]);

  function loadMore(): void {
    const nextPage = state.page + 1;
    setIsLoadingMore(true);
    apiClient
      .get<HotelReviewsResult>(`/hotels/${hotelId}/reviews?page=${nextPage}&pageSize=${PAGE_SIZE}`)
      .then((response) => {
        if (!response.success) return;
        setState((prev) => ({
          ...prev,
          items: [...prev.items, ...response.data.reviews.data],
          page: response.data.reviews.page,
          totalPages: response.data.reviews.totalPages,
        }));
      })
      .catch((error: unknown) => console.error("[useHotelReviews] loadMore", error))
      .finally(() => setIsLoadingMore(false));
  }

  return {
    averageRating: state.averageRating,
    reviewCount: state.reviewCount,
    breakdown: state.breakdown,
    items: state.items,
    isLoading: state.forId !== hotelId,
    isLoadingMore,
    hasMore: state.page > 0 && state.page < state.totalPages,
    loadMore,
  };
}
