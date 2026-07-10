import { HotelDetailsContent } from "@/features/hotel-details/components/HotelDetailsContent";

export default async function HotelDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HotelDetailsContent id={id} />;
}
