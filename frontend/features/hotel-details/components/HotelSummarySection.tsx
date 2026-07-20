"use client";

import { SparklesIcon } from "lucide-react";

import { useHotelSummary } from "@/features/hotel-details/hooks/useHotelSummary";

type Props = {
  hotelId: string;
};

export function HotelSummarySection({ hotelId }: Props) {
  const { summary, isLoading } = useHotelSummary(hotelId);

  // Unlike the other sections, loading gets a placeholder rather than nothing:
  // the first visitor to an uncached hotel waits on the model.
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border-default bg-elevated p-5 shadow-card">
        <div className="h-4 w-28 animate-pulse rounded-xl bg-subtle" />
        <div className="mt-4 flex flex-col gap-2">
          <div className="h-3 w-full animate-pulse rounded-xl bg-subtle" />
          <div className="h-3 w-11/12 animate-pulse rounded-xl bg-subtle" />
          <div className="h-3 w-2/3 animate-pulse rounded-xl bg-subtle" />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="rounded-2xl border border-border-default bg-elevated p-5 shadow-card">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
        <SparklesIcon className="h-4 w-4 text-accent-text" strokeWidth={1.5} />
        At a glance
      </h2>
      <p className="mt-4 text-sm text-text-secondary">{summary}</p>
      <p className="mt-3 text-xs text-text-muted">AI-generated from this hotel&apos;s details and guest ratings.</p>
    </div>
  );
}
