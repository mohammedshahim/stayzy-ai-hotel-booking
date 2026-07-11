"use client";

import { useSimilarHotels } from "@/features/hotel-details/hooks/useSimilarHotels";
import { SimilarHotelCard } from "@/features/hotel-details/components/SimilarHotelCard";

type Props = {
  hotelId: string;
};

export function SimilarHotelsSection({ hotelId }: Props) {
  const { hotels, isLoading } = useSimilarHotels(hotelId);

  if (isLoading || hotels.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text-primary">Similar Hotels</h2>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {hotels.map((hotel) => (
          <SimilarHotelCard key={hotel.id} hotel={hotel} />
        ))}
      </div>
    </div>
  );
}
