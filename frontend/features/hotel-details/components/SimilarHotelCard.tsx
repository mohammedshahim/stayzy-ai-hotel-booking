import Link from "next/link";

import { StarRating } from "@/components/common/StarRating";
import { GuestRatingBadge } from "@/components/common/GuestRatingBadge";
import { getGuestRatingLabel } from "@/features/search/lib/guest-rating";
import type { SimilarHotel } from "@/features/hotel-details/types";

type Props = {
  hotel: SimilarHotel;
};

export function SimilarHotelCard({ hotel }: Props) {
  const guestRatingLabel = getGuestRatingLabel(hotel.averageRating);

  return (
    <Link
      href={`/hotels/${hotel.id}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-border-default bg-elevated shadow-card transition-colors hover:border-border-subtle"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-subtle">
        {hotel.mainImageUrl && (
          /* eslint-disable-next-line @next/next/no-img-element -- S3-hosted photos, no next/image domain configured yet */
          <img
            src={hotel.mainImageUrl}
            alt={hotel.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>

      <div className="flex flex-col gap-2 p-4">
        <h3 className="text-base font-medium text-text-primary">{hotel.name}</h3>

        <div className="flex flex-wrap items-center gap-2">
          <StarRating rating={hotel.starRating} />
          <GuestRatingBadge score={hotel.averageRating} label={guestRatingLabel} />
          <span className="text-xs text-text-muted">{hotel.reviewCount} reviews</span>
        </div>

        <span className="text-sm text-text-secondary">
          {hotel.city}, {hotel.country}
        </span>
      </div>
    </Link>
  );
}
