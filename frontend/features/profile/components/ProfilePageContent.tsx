"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { AvatarNamePanel } from "@/features/profile/components/AvatarNamePanel";
import { EmailPanel } from "@/features/profile/components/EmailPanel";
import { PasswordPanel } from "@/features/profile/components/PasswordPanel";

export function ProfilePageContent() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-text-primary sm:text-3xl">Profile</h1>

      <AvatarNamePanel name={user.name} avatarUrl={user.avatarUrl} />
      <EmailPanel email={user.email} emailVerified={user.emailVerified} />
      <PasswordPanel />

      <div className="flex items-center gap-4 px-1 text-sm">
        <Link href="/bookings" className="text-text-secondary transition-colors hover:text-text-primary">
          My Bookings
        </Link>
        <Link href="/favorites" className="text-text-secondary transition-colors hover:text-text-primary">
          Favorites
        </Link>
      </div>
    </div>
  );
}
