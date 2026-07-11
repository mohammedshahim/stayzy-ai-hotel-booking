"use client";

import { MessageSquareIcon } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { useHotelReviews } from "@/features/reviews/hooks/useHotelReviews";
import { RatingBreakdown } from "@/features/reviews/components/RatingBreakdown";
import { ReviewListItem } from "@/features/reviews/components/ReviewListItem";

type Props = {
  hotelId: string;
};

export function ReviewsSection({ hotelId }: Props) {
  const { averageRating, reviewCount, breakdown, items, isLoading, isLoadingMore, hasMore, loadMore } =
    useHotelReviews(hotelId);

  return (
    <div className="rounded-2xl border border-border-default bg-elevated p-5 shadow-card">
      <h2 className="text-lg font-semibold text-text-primary">Reviews</h2>

      <div className="mt-4 flex flex-col gap-5">
        {isLoading ? null : reviewCount === 0 ? (
          <EmptyState
            icon={MessageSquareIcon}
            heading="No reviews yet"
            body="This hotel hasn't been reviewed yet — check back after a few guests have stayed."
          />
        ) : (
          <>
            {breakdown && <RatingBreakdown averageRating={averageRating} reviewCount={reviewCount} breakdown={breakdown} />}

            <div className="flex flex-col gap-5">
              {items.map((review) => (
                <ReviewListItem key={review.id} review={review} />
              ))}
            </div>

            {hasMore && (
              <button
                type="button"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="self-center bg-elevated hover:bg-subtle border border-border-default hover:border-border-subtle text-text-secondary hover:text-text-primary h-9 px-4 rounded-xl transition-colors disabled:pointer-events-none disabled:opacity-60"
              >
                {isLoadingMore ? "Loading..." : "Load more"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
