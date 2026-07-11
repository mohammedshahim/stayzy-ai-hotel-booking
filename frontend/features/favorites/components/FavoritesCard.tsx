"use client";

import Link from "next/link";
import { format } from "date-fns";
import { HeartIcon } from "lucide-react";

import { StarRating } from "@/components/common/StarRating";
import { GuestRatingBadge } from "@/components/common/GuestRatingBadge";
import { getGuestRatingLabel } from "@/features/search/lib/guest-rating";
import type { FavoriteHotel } from "@/features/favorites/types";

type Props = {
  hotel: FavoriteHotel;
  onRemove: () => void;
};

export function FavoritesCard({ hotel, onRemove }: Props) {
  const guestRatingLabel = getGuestRatingLabel(hotel.averageRating);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border-default bg-elevated shadow-card ring-1 ring-inset ring-accent-border transition-colors">
      <div className="relative aspect-[4/3] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element -- S3-hosted photos, no next/image domain configured yet */}
        <img
          src={hotel.mainImageUrl ?? ""}
          alt={hotel.name}
          className="h-full w-full rounded-t-2xl object-cover"
        />
        <button
          type="button"
          onClick={onRemove}
          aria-pressed
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl bg-elevated/90 text-text-muted backdrop-blur-sm transition-colors hover:text-text-secondary"
        >
          <HeartIcon className="h-4 w-4 fill-current text-accent-primary" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-base font-medium text-text-primary">{hotel.name}</h3>
        <span className="text-xs text-text-muted">Saved on {format(new Date(hotel.savedAt), "MMM d, yyyy")}</span>

        <div className="flex flex-wrap items-center gap-2">
          <StarRating rating={hotel.starRating} />
          <GuestRatingBadge score={hotel.averageRating} label={guestRatingLabel} />
          <span className="text-xs text-text-muted">{hotel.reviewCount} reviews</span>
        </div>

        <span className="text-sm text-text-secondary">
          {hotel.city}, {hotel.country}
        </span>

        <div className="mt-auto flex items-end justify-between pt-2">
          {hotel.fromPrice !== null ? (
            <span className="text-xl font-bold text-text-primary">
              from <span>${hotel.fromPrice}</span>
              <span className="text-xs font-normal text-text-muted">/night</span>
            </span>
          ) : (
            <span />
          )}
          <Link
            href={`/hotels/${hotel.id}`}
            className="flex h-9 items-center rounded-xl border border-border-default bg-elevated px-4 font-medium text-text-secondary transition-colors hover:border-border-subtle hover:bg-subtle hover:text-text-primary"
          >
            See availability
          </Link>
        </div>
      </div>
    </div>
  );
}
