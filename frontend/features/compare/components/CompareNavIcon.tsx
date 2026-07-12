"use client";

import Link from "next/link";
import { ScaleIcon } from "lucide-react";

import { useCompareSelection } from "@/features/compare/hooks/useCompareSelection";

export function CompareNavIcon() {
  const { ids } = useCompareSelection();

  return (
    <Link
      href="/compare"
      aria-label="Compare hotels"
      className="relative flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-subtle hover:text-text-secondary"
    >
      <ScaleIcon className="h-5 w-5" strokeWidth={1.5} />
      {ids.length > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-primary px-1 text-[10px] font-medium leading-none text-white">
          {ids.length}
        </span>
      )}
    </Link>
  );
}
