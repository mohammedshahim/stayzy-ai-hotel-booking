"use client";

import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

type Props = {
  label: string;
  path: string;
};

export function ChatCheckoutButton({ label, path }: Props) {
  return (
    <Link
      href={path}
      className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-accent-primary px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover hover:shadow-accent"
    >
      {label}
      <ArrowRightIcon className="h-4 w-4" />
    </Link>
  );
}
