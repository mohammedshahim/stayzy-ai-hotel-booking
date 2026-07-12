import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-server-session";
import { BookingConfirmationPageContent } from "@/features/booking/components/BookingConfirmationPageContent";

export default async function BookingConfirmationPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const user = await getServerSession();
  if (!user) {
    redirect(`/login?returnTo=${encodeURIComponent(`/booking-confirmation/${bookingId}`)}`);
  }

  // BookingConfirmationPageContent reads useSearchParams (for Stripe's redirect_status),
  // which requires a Suspense boundary to avoid deopting prerendering of this route.
  return (
    <Suspense fallback={null}>
      <BookingConfirmationPageContent bookingId={bookingId} />
    </Suspense>
  );
}
