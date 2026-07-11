import { StarRating } from "@/components/common/StarRating";
import type { RatingBreakdown as RatingBreakdownType } from "@/features/hotel-details/types";

type Props = {
  averageRating: number;
  reviewCount: number;
  breakdown: RatingBreakdownType;
};

const STARS = [5, 4, 3, 2, 1] as const;

export function RatingBreakdown({ averageRating, reviewCount, breakdown }: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
      <div className="flex shrink-0 flex-col items-center gap-1 sm:items-start">
        <span className="text-3xl font-semibold text-text-primary">{averageRating.toFixed(1)}</span>
        <StarRating rating={Math.round(averageRating)} />
        <span className="text-xs text-text-muted">{reviewCount} reviews</span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        {STARS.map((star) => {
          const count = breakdown[star];
          const percent = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs text-text-muted">
              <span className="w-3 shrink-0">{star}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle">
                <div className="h-full rounded-full bg-rating-star" style={{ width: `${percent}%` }} />
              </div>
              <span className="w-6 shrink-0 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
