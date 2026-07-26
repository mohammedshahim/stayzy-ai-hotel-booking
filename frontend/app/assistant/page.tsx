import { redirect } from "next/navigation";

import { AssistantShell } from "@/features/chat/components/AssistantShell";
import { getServerSession } from "@/lib/get-server-session";

export const metadata = {
  title: "Assistant — Stayzy",
};

export default async function AssistantPage() {
  const user = await getServerSession();
  if (!user) redirect("/login?returnTo=/assistant");
  // Every turn is refused with 403 until the email is verified, booking or not.
  if (!user.emailVerified) redirect("/verify-email");

  return <AssistantShell />;
}
