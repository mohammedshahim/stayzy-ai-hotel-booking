import { ImageOffIcon, ShieldCheckIcon, UsersIcon, UtensilsIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { RoomTypeAvailability } from "@/features/hotel-details/types";

type Props = {
  roomType: RoomTypeAvailability;
};

export function RoomTypeCard({ roomType }: Props) {
  const mainImage = roomType.images.find((image) => image.isMain) ?? roomType.images[0] ?? null;
  // Booking creation doesn't exist until Feature 19 — Reserve is always disabled; the label
  // just distinguishes "not bookable because sold out" from "not bookable yet at all".
  const buttonLabel = roomType.isSoldOut ? "Sold out" : "Coming soon";

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border-default bg-elevated shadow-card sm:flex-row",
        roomType.isSoldOut && "opacity-60",
      )}
    >
      <div className="relative aspect-[4/3] w-full shrink-0 sm:aspect-square sm:w-48">
        {mainImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- S3-hosted photos, no next/image domain configured yet
          <img src={mainImage.url} alt={roomType.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-subtle">
            <ImageOffIcon className="h-8 w-8 text-text-faint" strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-base font-medium text-text-primary">{roomType.name}</h3>
        <p className="line-clamp-2 text-sm text-text-secondary">{roomType.description}</p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <UsersIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
            Up to {roomType.maxAdults} adults{roomType.maxKids > 0 ? `, ${roomType.maxKids} kids` : ""}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UtensilsIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
            {roomType.mealPlanName}
          </span>
          {roomType.freeCancellation && (
            <span className="inline-flex items-center gap-1.5 text-accent-text">
              <ShieldCheckIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
              Free cancellation
            </span>
          )}
        </div>

        {roomType.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {roomType.features.map((feature) => (
              <span
                key={feature.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-accent-border bg-accent-dim px-2.5 py-1 text-xs text-accent-text"
              >
                {feature.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-text-primary">${roomType.avgNightlyPrice}</span>
            <span className="text-xs text-text-muted">
              {roomType.isSoldOut ? "Sold out for these dates" : `${roomType.remainingInventory} rooms left`}
            </span>
          </div>
          <Button
            type="button"
            disabled
            className="h-9 rounded-xl bg-accent-primary px-4 font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            {buttonLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
