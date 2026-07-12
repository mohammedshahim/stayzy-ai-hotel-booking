"use client";

import { HeartIcon, MapPinOffIcon, MapPinIcon, ScaleIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { StarRating } from "@/components/common/StarRating";
import { GuestRatingBadge } from "@/components/common/GuestRatingBadge";
import { getGuestRatingLabel } from "@/features/search/lib/guest-rating";
import { useFavoriteHotelIds } from "@/features/favorites/hooks/useFavoriteHotelIds";
import { useCompareSelection } from "@/features/compare/hooks/useCompareSelection";
import { useHotelDetails } from "@/features/hotel-details/hooks/useHotelDetails";
import { HotelGallery } from "@/features/hotel-details/components/HotelGallery";
import { AmenitiesList } from "@/features/hotel-details/components/AmenitiesList";
import { PoliciesSection } from "@/features/hotel-details/components/PoliciesSection";
import { RoomSelectionSection } from "@/features/hotel-details/components/RoomSelectionSection";
import { SimilarHotelsSection } from "@/features/hotel-details/components/SimilarHotelsSection";
import { ReviewsSection } from "@/features/reviews/components/ReviewsSection";
import { LocationMapPanel } from "@/features/hotel-details/components/LocationMapPanel";
import { HotelDetailsSkeleton } from "@/features/hotel-details/components/HotelDetailsSkeleton";
import type { RoomSelectionSearch } from "@/features/hotel-details/types";

type Props = {
  id: string;
  initialSearch: RoomSelectionSearch;
};

export function HotelDetailsContent({ id, initialSearch }: Props) {
  const { hotel, isLoading } = useHotelDetails(id);
  const { favoritedIds, toggleFavorite } = useFavoriteHotelIds();
  const { isSelected: isCompared, isFull, add, remove } = useCompareSelection();

  if (isLoading) {
    return <HotelDetailsSkeleton />;
  }

  if (!hotel) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <EmptyState
          icon={MapPinOffIcon}
          heading="Hotel not found"
          body="This hotel may have been removed or is no longer available."
        />
      </div>
    );
  }

  const guestRatingLabel = getGuestRatingLabel(hotel.averageRating);
  const location = [hotel.addressLine1, hotel.city, hotel.state, hotel.country].filter(Boolean).join(", ");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
      <HotelGallery images={hotel.images} hotelName={hotel.name} />

      <div className="flex flex-col gap-3">
        <StarRating rating={hotel.starRating} />
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-text-primary sm:text-3xl">{hotel.name}</h1>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => toggleFavorite(hotel.id)}
              aria-pressed={favoritedIds.has(hotel.id)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-default bg-elevated text-text-muted transition-colors hover:text-text-secondary"
            >
              <HeartIcon className={cn("h-4 w-4", favoritedIds.has(hotel.id) && "fill-current text-accent-primary")} />
            </button>
            <button
              type="button"
              onClick={() => (isCompared(hotel.id) ? remove(hotel.id) : add(hotel.id))}
              aria-pressed={isCompared(hotel.id)}
              disabled={!isCompared(hotel.id) && isFull}
              title={!isCompared(hotel.id) && isFull ? "Remove a hotel to add another to compare" : undefined}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-default bg-elevated text-text-muted transition-colors hover:text-text-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ScaleIcon className={cn("h-4 w-4", isCompared(hotel.id) && "text-accent-primary")} />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm text-text-muted">
            <MapPinIcon className="h-4 w-4" strokeWidth={1.5} />
            {location}
          </span>
          <GuestRatingBadge score={hotel.averageRating} label={guestRatingLabel} />
          <span className="text-sm text-text-muted">{hotel.reviewCount} reviews</span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-6">
          <p className="whitespace-pre-line text-sm text-text-secondary">{hotel.description}</p>

          <AmenitiesList amenities={hotel.amenities} />

          <RoomSelectionSection hotelId={hotel.id} initialSearch={initialSearch} />

          <PoliciesSection
            checkInTime={hotel.checkInTime}
            checkOutTime={hotel.checkOutTime}
            freeCancellation={hotel.freeCancellation}
            cancellationPolicy={hotel.cancellationPolicy}
          />

          <ReviewsSection hotelId={hotel.id} />

          <SimilarHotelsSection hotelId={hotel.id} />
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-20 lg:h-fit">
          <LocationMapPanel latitude={hotel.latitude} longitude={hotel.longitude} />
        </div>
      </div>
    </div>
  );
}
