"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HeartIcon, MapPinIcon, ScaleIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/common/StarRating";
import { GuestRatingBadge } from "@/components/common/GuestRatingBadge";
import { getGuestRatingLabel } from "@/features/search/lib/guest-rating";
import { useCompareSelection } from "@/features/compare/hooks/useCompareSelection";
import type { SearchResultHotel } from "@/features/search/types";

type Props = {
  hotel: SearchResultHotel;
  variant: "grid" | "list";
  isSelected?: boolean;
  onLocate: () => void;
  isFavorited: boolean;
  onToggleFavorite: () => void;
};

const VISIBLE_AMENITY_COUNT = 3;

// Carried over so the details page's room selector starts pre-filled instead of resetting to today/tomorrow.
const CARRIED_PARAM_KEYS = ["checkIn", "checkOut", "adults", "kids", "rooms"] as const;

export function HotelCard({ hotel, variant, isSelected, onLocate, isFavorited, onToggleFavorite }: Props) {
  const { isSelected: isCompared, isFull, add, remove } = useCompareSelection();
  const searchParams = useSearchParams();

  const guestRatingLabel = getGuestRatingLabel(hotel.guestRating);
  const visibleAmenities = hotel.amenities.slice(0, VISIBLE_AMENITY_COUNT);
  const extraAmenityCount = hotel.amenities.length - visibleAmenities.length;

  const detailsParams = new URLSearchParams();
  for (const key of CARRIED_PARAM_KEYS) {
    const value = searchParams.get(key);
    if (value) detailsParams.set(key, value);
  }
  const detailsHref = detailsParams.size > 0 ? `/hotels/${hotel.id}?${detailsParams.toString()}` : `/hotels/${hotel.id}`;

  return (
    <div
      className={cn(
        "flex overflow-hidden rounded-2xl border bg-elevated shadow-card transition-colors",
        isSelected ? "border-accent-border" : "border-border-default",
        variant === "grid" ? "flex-col" : "flex-col sm:flex-row",
      )}
    >
      <div
        className={cn(
          "relative shrink-0",
          variant === "grid" ? "aspect-[4/3] w-full" : "aspect-[4/3] w-full sm:w-56 md:w-64",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- S3-hosted photos, no next/image domain configured yet */}
        <img src={hotel.image ?? ""} alt={hotel.name} className="h-full w-full object-cover" />
        <div className="absolute right-3 top-3 flex gap-2">
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={isFavorited}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-elevated/90 text-text-muted backdrop-blur-sm transition-colors hover:text-text-secondary"
          >
            <HeartIcon className={cn("h-4 w-4", isFavorited && "fill-current text-accent-primary")} />
          </button>
          <button
            type="button"
            onClick={() => (isCompared(hotel.id) ? remove(hotel.id) : add(hotel.id))}
            aria-pressed={isCompared(hotel.id)}
            disabled={!isCompared(hotel.id) && isFull}
            title={!isCompared(hotel.id) && isFull ? "Remove a hotel to add another to compare" : undefined}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-elevated/90 text-text-muted backdrop-blur-sm transition-colors hover:text-text-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ScaleIcon className={cn("h-4 w-4", isCompared(hotel.id) && "text-accent-primary")} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-base font-medium text-text-primary">{hotel.name}</h3>

        <div className="flex flex-wrap items-center gap-2">
          <StarRating rating={hotel.starRating} />
          <GuestRatingBadge score={hotel.guestRating} label={guestRatingLabel} />
          <span className="text-xs text-text-muted">{hotel.reviewCount} reviews</span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-text-secondary">
            {hotel.city}, {hotel.country}
          </span>
          {hotel.distanceKm !== null && (
            <span className="text-xs text-text-muted">{hotel.distanceKm} km away</span>
          )}
          <button
            type="button"
            onClick={onLocate}
            className="flex w-fit items-center gap-1 text-xs text-text-muted transition-colors hover:text-text-secondary"
          >
            <MapPinIcon className="h-3.5 w-3.5 text-text-muted" />
            View on map
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {visibleAmenities.map((amenity) => (
            <span
              key={amenity}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent-border bg-accent-dim px-2.5 py-1 text-xs text-accent-text"
            >
              {amenity}
            </span>
          ))}
          {extraAmenityCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-border bg-accent-dim px-2.5 py-1 text-xs text-accent-text">
              +{extraAmenityCount} more
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between pt-2">
          <span className="text-xl font-bold text-text-primary">${hotel.pricePerNight}</span>
          <Button
            render={<Link href={detailsHref} />}
            nativeButton={false}
            className="h-9 rounded-xl border border-border-default bg-elevated px-4 font-medium text-text-secondary transition-colors hover:border-border-subtle hover:bg-subtle hover:text-text-primary"
          >
            See availability
          </Button>
        </div>
      </div>
    </div>
  );
}
