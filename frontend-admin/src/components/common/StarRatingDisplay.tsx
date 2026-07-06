import { Star } from "lucide-react";

type Props = {
  rating: number;
};

export function StarRatingDisplay({ rating }: Props) {
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${rating} star rating`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={index < rating ? "size-4 fill-current text-rating-star" : "size-4 text-rating-star-empty"}
        />
      ))}
    </div>
  );
}
