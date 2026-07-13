import { StarIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  rating: number;
  className?: string;
  onChange?: (rating: number) => void;
};

const MAX_STARS = 5;

export function StarRating({ rating, className, onChange }: Props) {
  const interactive = Boolean(onChange);

  return (
    <div className={cn("inline-flex items-center gap-0.5", className)} role={interactive ? "radiogroup" : undefined}>
      {Array.from({ length: MAX_STARS }, (_, index) => {
        const starValue = index + 1;
        const filled = starValue <= rating;

        if (!interactive) {
          return (
            <StarIcon key={index} className={cn("h-4 w-4", filled ? "fill-current text-rating-star" : "text-rating-star-empty")} />
          );
        }

        return (
          <button
            key={index}
            type="button"
            role="radio"
            aria-checked={filled}
            aria-label={`${starValue} star${starValue === 1 ? "" : "s"}`}
            onClick={() => onChange?.(starValue)}
            className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <StarIcon
              className={cn("h-6 w-6 transition-colors", filled ? "fill-current text-rating-star" : "text-rating-star-empty")}
            />
          </button>
        );
      })}
    </div>
  );
}
