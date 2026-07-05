import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { getServerSession } from "@/lib/get-server-session";

export async function Navbar() {
  const user = await getServerSession();

  return (
    <header className="fixed top-0 z-40 h-16 w-full border-b border-border-default bg-surface px-6">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-text-primary">
          Stayzy
        </Link>
        {user ? (
          <AccountMenu user={user} />
        ) : (
          <Button
            render={<Link href="/login" />}
            nativeButton={false}
            className="h-9 rounded-xl bg-accent-primary px-4 font-medium text-white transition-colors hover:bg-accent-hover hover:shadow-accent"
          >
            Log in
          </Button>
        )}
      </div>
    </header>
  );
}
