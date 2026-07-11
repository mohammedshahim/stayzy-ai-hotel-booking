import { UserIcon } from "lucide-react";
import { format } from "date-fns";

import { StarRating } from "@/components/common/StarRating";
import type { Review } from "@/features/hotel-details/types";

type Props = {
  review: Review;
};

export function ReviewListItem({ review }: Props) {
  return (
    <div className="flex flex-col gap-2 border-b border-border-default pb-5 last:border-b-0 last:pb-0">
      <div className="flex items-center gap-3">
        {review.reviewerAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external avatar URLs, no next/image domain configured yet
          <img
            src={review.reviewerAvatarUrl}
            alt={review.reviewerName}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-dim text-accent-text">
            <UserIcon className="h-5 w-5" />
          </span>
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-text-primary">{review.reviewerName}</span>
          <span className="text-xs text-text-muted">{format(new Date(review.createdAt), "MMM d, yyyy")}</span>
        </div>
      </div>
      <StarRating rating={review.rating} />
      <p className="text-sm text-text-secondary">{review.description}</p>
    </div>
  );
}
