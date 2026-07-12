"use client";

import Link from "next/link";
import { ScaleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { useCompareSelection } from "@/features/compare/hooks/useCompareSelection";
import { useCompareHotels } from "@/features/compare/hooks/useCompareHotels";
import { CompareSearchBox } from "@/features/compare/components/CompareSearchBox";
import { CompareTable } from "@/features/compare/components/CompareTable";

export function ComparePageContent() {
  const { ids } = useCompareSelection();
  const { hotels, isLoading } = useCompareHotels(ids);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-text-primary sm:text-3xl">Compare hotels</h1>

      <div className="max-w-md">
        <CompareSearchBox />
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-text-muted">Loading comparison…</p>
      ) : hotels.length === 0 ? (
        <EmptyState
          icon={ScaleIcon}
          heading="No hotels to compare yet"
          body="Add hotels from search results, favorites, or the search box above."
          action={
            <Button
              render={<Link href="/search" />}
              nativeButton={false}
              className="h-9 rounded-xl border border-border-default bg-elevated px-4 font-medium text-text-secondary transition-colors hover:border-border-subtle hover:bg-subtle hover:text-text-primary"
            >
              Browse hotels
            </Button>
          }
        />
      ) : (
        <CompareTable hotels={hotels} />
      )}
    </div>
  );
}
