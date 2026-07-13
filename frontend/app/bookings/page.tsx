import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-server-session";
import { BookingsPageContent } from "@/features/booking/components/BookingsPageContent";

export default async function BookingsPage() {
  const user = await getServerSession();
  if (!user) {
    redirect(`/login?returnTo=${encodeURIComponent("/bookings")}`);
  }

  return <BookingsPageContent />;
}
