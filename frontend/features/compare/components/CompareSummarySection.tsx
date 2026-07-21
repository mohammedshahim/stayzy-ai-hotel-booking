"use client";

import { SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MIN_COMPARE_HOTELS } from "@/features/compare/components/CompareProvider";
import { useCompareSummary } from "@/features/compare/hooks/useCompareSummary";

type Props = {
  hotelIds: string[];
};

export function CompareSummarySection({ hotelIds }: Props) {
  const { summary, isLoading, hasFailed, generate } = useCompareSummary(hotelIds);

  if (hotelIds.length < MIN_COMPARE_HOTELS) return null;

  return (
    <div className="rounded-2xl border border-border-default bg-elevated p-5 shadow-card">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
        <SparklesIcon className="h-4 w-4 text-accent-text" strokeWidth={1.5} />
        Compare with AI
      </h2>

      {isLoading ? (
        <div className="mt-4 flex flex-col gap-2">
          <div className="h-3 w-full animate-pulse rounded-xl bg-subtle" />
          <div className="h-3 w-11/12 animate-pulse rounded-xl bg-subtle" />
          <div className="h-3 w-2/3 animate-pulse rounded-xl bg-subtle" />
        </div>
      ) : summary ? (
        <>
          <p className="mt-4 text-sm text-text-secondary">{summary}</p>
          <p className="mt-3 text-xs text-text-muted">
            AI-generated from these hotels&apos; details. Prices are not compared — check each column above.
          </p>
        </>
      ) : (
        <>
          <p className="mt-4 text-sm text-text-secondary">
            See what sets these {hotelIds.length} hotels apart, written for you in a few seconds.
          </p>
          {hasFailed && (
            <p className="mt-3 text-xs text-error">Couldn&apos;t write the comparison just now. Try again.</p>
          )}
          <Button
            onClick={generate}
            className="mt-4 h-9 rounded-xl border border-border-default bg-elevated px-4 font-medium text-text-secondary transition-colors hover:border-border-subtle hover:bg-subtle hover:text-text-primary"
          >
            {hasFailed ? "Try again" : "Compare with AI"}
          </Button>
        </>
      )}
    </div>
  );
}
