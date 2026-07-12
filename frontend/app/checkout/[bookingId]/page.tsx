import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-server-session";
import { CheckoutPageContent } from "@/features/booking/components/CheckoutPageContent";

export default async function CheckoutPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const user = await getServerSession();
  if (!user) {
    redirect(`/login?returnTo=${encodeURIComponent(`/checkout/${bookingId}`)}`);
  }

  return <CheckoutPageContent bookingId={bookingId} />;
}
