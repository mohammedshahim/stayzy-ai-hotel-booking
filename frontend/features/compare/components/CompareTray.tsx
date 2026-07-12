"use client";

import Link from "next/link";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCompareSelection } from "@/features/compare/hooks/useCompareSelection";
import { useCompareHotels } from "@/features/compare/hooks/useCompareHotels";

export function CompareTray() {
  const { ids, clear } = useCompareSelection();
  const { hotels } = useCompareHotels(ids);

  if (ids.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-30 mx-auto max-w-3xl px-4">
      <div className="flex items-center gap-3 rounded-2xl border border-border-default bg-surface px-5 py-4 shadow-elevated">
        <div className="flex -space-x-2">
          {hotels.map((hotel) => (
            // eslint-disable-next-line @next/next/no-img-element -- S3-hosted photos, no next/image domain configured yet
            <img
              key={hotel.id}
              src={hotel.mainImageUrl ?? ""}
              alt={hotel.name}
              className="h-9 w-9 rounded-full border-2 border-surface object-cover"
            />
          ))}
        </div>
        <span className="flex-1 text-sm font-medium text-text-secondary">
          {ids.length} {ids.length === 1 ? "hotel" : "hotels"} selected
        </span>
        <Button
          render={<Link href="/compare" />}
          nativeButton={false}
          className="h-9 rounded-xl bg-accent-primary px-4 font-medium text-white transition-colors hover:bg-accent-hover hover:shadow-accent"
        >
          Compare
        </Button>
        <button
          type="button"
          onClick={clear}
          aria-label="Clear compare selection"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-subtle hover:text-text-secondary"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
