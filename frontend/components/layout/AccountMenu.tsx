"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDownIcon, LogOutIcon, UserIcon } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { authClient } from "@/lib/auth-client";
import type { SessionUser } from "@/lib/get-server-session";

type Props = {
  user: SessionUser;
};

export function AccountMenu({ user }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <Popover>
      <PopoverTrigger className="flex h-9 items-center gap-2 rounded-xl border border-border-default bg-elevated px-3 text-sm text-text-secondary transition-colors hover:border-border-subtle hover:text-text-primary">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-dim text-accent-text">
          <UserIcon className="h-3.5 w-3.5" />
        </span>
        <span className="max-w-[8rem] truncate">{user.name}</span>
        <ChevronDownIcon className="h-4 w-4 text-text-muted" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 border border-border-default bg-elevated p-1.5 shadow-elevated">
        <Link
          href="/bookings"
          className="flex h-9 items-center rounded-lg px-2.5 text-sm text-text-secondary transition-colors hover:bg-subtle hover:text-text-primary"
        >
          My Bookings
        </Link>
        <Link
          href="/profile"
          className="flex h-9 items-center rounded-lg px-2.5 text-sm text-text-secondary transition-colors hover:bg-subtle hover:text-text-primary"
        >
          Profile
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-sm text-state-error transition-colors hover:bg-state-error-dim"
        >
          <LogOutIcon className="h-4 w-4" />
          Logout
        </button>
      </PopoverContent>
    </Popover>
  );
}
