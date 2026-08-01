import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-server-session";
import { ProfilePageContent } from "@/features/profile/components/ProfilePageContent";

export default async function ProfilePage() {
  const user = await getServerSession();
  if (!user) {
    redirect(`/login?returnTo=${encodeURIComponent("/profile")}`);
  }

  return <ProfilePageContent />;
}
