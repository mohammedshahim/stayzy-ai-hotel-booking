import { cn } from "@/lib/utils";
import { HotelCardSkeleton } from "@/features/search/components/HotelCardSkeleton";
import { RESULTS_PER_PAGE } from "@/features/search/hooks/useSearchResults";
import type { SearchState } from "@/features/search/types";

type Props = {
  view: SearchState["view"];
};

export function SearchResultsSkeleton({ view }: Props) {
  if (view === "map") {
    return <div className="h-[32rem] w-full animate-pulse rounded-2xl bg-subtle" />;
  }

  return (
    <div className={cn(view === "grid" ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4")}>
      {Array.from({ length: RESULTS_PER_PAGE }, (_, index) => (
        <HotelCardSkeleton key={index} variant={view === "grid" ? "grid" : "list"} />
      ))}
    </div>
  );
}
