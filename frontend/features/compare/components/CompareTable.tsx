"use client";

import Link from "next/link";
import { XIcon } from "lucide-react";

import { StarRating } from "@/components/common/StarRating";
import { GuestRatingBadge } from "@/components/common/GuestRatingBadge";
import { getGuestRatingLabel } from "@/features/search/lib/guest-rating";
import { useCompareSelection } from "@/features/compare/hooks/useCompareSelection";
import type { CompareHotel } from "@/features/compare/types";

type Props = {
  hotels: CompareHotel[];
};

// Per ui-rules.md's Compare Table spec: columns never wrap/shrink, extras reveal via horizontal scroll.
const ROW_LABEL_CLASS = "sticky left-0 z-10 whitespace-nowrap bg-surface px-4 py-3 text-sm font-medium text-text-secondary";
const CELL_CLASS = "min-w-[16rem] px-4 py-3 text-sm text-text-secondary align-top";

export function CompareTable({ hotels }: Props) {
  const { remove } = useCompareSelection();

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-2xl border border-border-default bg-surface">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border-default">
              <th className={ROW_LABEL_CLASS}>Hotel</th>
              {hotels.map((hotel) => (
                <th key={hotel.id} className={CELL_CLASS}>
                  <div className="flex flex-col gap-2">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element -- S3-hosted photos, no next/image domain configured yet */}
                      <img
                        src={hotel.mainImageUrl ?? ""}
                        alt={hotel.name}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => remove(hotel.id)}
                        aria-label={`Remove ${hotel.name} from compare`}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-elevated/90 text-text-muted backdrop-blur-sm transition-colors hover:text-text-secondary"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Link
                      href={`/hotels/${hotel.id}`}
                      className="text-left text-base font-medium text-text-primary hover:underline"
                    >
                      {hotel.name}
                    </Link>
                    <span className="text-xs font-normal text-text-muted">
                      {hotel.city}, {hotel.country}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-default">
              <td className={ROW_LABEL_CLASS}>Price</td>
              {hotels.map((hotel) => (
                <td key={hotel.id} className={CELL_CLASS}>
                  {hotel.fromPrice !== null ? (
                    <span className="text-lg font-bold text-text-primary">
                      from ${hotel.fromPrice}
                      <span className="text-xs font-normal text-text-muted">/night</span>
                    </span>
                  ) : (
                    <span className="text-text-faint">—</span>
                  )}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border-default">
              <td className={ROW_LABEL_CLASS}>Rating</td>
              {hotels.map((hotel) => (
                <td key={hotel.id} className={CELL_CLASS}>
                  <div className="flex flex-col gap-1.5">
                    <StarRating rating={hotel.starRating} />
                    <div className="flex items-center gap-2">
                      <GuestRatingBadge score={hotel.averageRating} label={getGuestRatingLabel(hotel.averageRating)} />
                      <span className="text-xs text-text-muted">{hotel.reviewCount} reviews</span>
                    </div>
                  </div>
                </td>
              ))}
            </tr>
            <tr className="border-b border-border-default">
              <td className={ROW_LABEL_CLASS}>Amenities</td>
              {hotels.map((hotel) => (
                <td key={hotel.id} className={CELL_CLASS}>
                  <div className="flex flex-wrap gap-1.5">
                    {hotel.amenities.length > 0 ? (
                      hotel.amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="inline-flex items-center gap-1.5 rounded-full border border-accent-border bg-accent-dim px-2.5 py-1 text-xs text-accent-text"
                        >
                          {amenity}
                        </span>
                      ))
                    ) : (
                      <span className="text-text-faint">—</span>
                    )}
                  </div>
                </td>
              ))}
            </tr>
            <tr>
              <td className={ROW_LABEL_CLASS}>Cancellation</td>
              {hotels.map((hotel) => (
                <td key={hotel.id} className={CELL_CLASS}>
                  <p className="mb-1 text-sm font-medium text-text-primary">
                    {hotel.freeCancellation ? "Free cancellation" : "Cancellation policy"}
                  </p>
                  <p className="text-xs text-text-muted">{hotel.cancellationPolicy}</p>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Reserved for the later AI phase (project-overview.md); hidden/static until that phase ships. */}
      <div className="hidden rounded-2xl border border-border-default bg-elevated p-5">
        <p className="text-sm text-text-muted">AI summary coming soon.</p>
      </div>
    </div>
  );
}
