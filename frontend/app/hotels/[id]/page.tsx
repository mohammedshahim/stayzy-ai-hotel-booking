import { HotelDetailsContent } from "@/features/hotel-details/components/HotelDetailsContent";
import type { RoomSelectionSearch } from "@/features/hotel-details/types";

type SearchParams = { checkIn?: string; checkOut?: string; adults?: string; kids?: string; rooms?: string };

function parseInitialSearch(params: SearchParams): RoomSelectionSearch {
  return {
    checkIn: params.checkIn ?? null,
    checkOut: params.checkOut ?? null,
    adults: Number(params.adults) || 2,
    kids: Number(params.kids) || 0,
    rooms: Number(params.rooms) || 1,
  };
}

export default async function HotelDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const initialSearch = parseInitialSearch(await searchParams);
  return <HotelDetailsContent id={id} initialSearch={initialSearch} />;
}
