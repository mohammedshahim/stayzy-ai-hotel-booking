import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-server-session";
import { ReviewPageContent } from "@/features/reviews/components/ReviewPageContent";

export default async function BookingReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getServerSession();
  if (!user) {
    redirect(`/login?returnTo=${encodeURIComponent(`/bookings/${id}/review`)}`);
  }

  return <ReviewPageContent bookingId={id} />;
}
