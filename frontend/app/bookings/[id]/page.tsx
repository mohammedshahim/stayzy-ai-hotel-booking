import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-server-session";
import { BookingDetailPageContent } from "@/features/booking/components/BookingDetailPageContent";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getServerSession();
  if (!user) {
    redirect(`/login?returnTo=${encodeURIComponent(`/bookings/${id}`)}`);
  }

  return <BookingDetailPageContent bookingId={id} />;
}
