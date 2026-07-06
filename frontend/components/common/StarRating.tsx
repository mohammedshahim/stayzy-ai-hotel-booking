import { StarIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  rating: number;
  className?: string;
};

const MAX_STARS = 5;

export function StarRating({ rating, className }: Props) {
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: MAX_STARS }, (_, index) => (
        <StarIcon
          key={index}
          className={cn(
            "h-4 w-4",
            index < rating ? "fill-current text-rating-star" : "text-rating-star-empty",
          )}
        />
      ))}
    </div>
  );
}
