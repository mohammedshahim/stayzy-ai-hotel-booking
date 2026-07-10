import { getAmenityIcon } from "@/features/hotel-details/lib/amenity-icons";
import type { HotelAmenity } from "@/features/hotel-details/types";

type Props = {
  amenities: HotelAmenity[];
};

export function AmenitiesList({ amenities }: Props) {
  if (amenities.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border-default bg-elevated p-5 shadow-card">
      <h2 className="text-lg font-semibold text-text-primary">Amenities</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {amenities.map((amenity) => {
          const Icon = getAmenityIcon(amenity.icon);
          return (
            <div key={amenity.id} className="flex items-center gap-2 text-sm text-text-secondary">
              <Icon className="h-4 w-4 shrink-0 text-accent-text" strokeWidth={1.5} />
              {amenity.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}
