import { cn } from "@/lib/utils";

type Props = {
  variant: "grid" | "list";
};

export function HotelCardSkeleton({ variant }: Props) {
  return (
    <div
      className={cn(
        "flex overflow-hidden rounded-2xl border border-border-default bg-elevated shadow-card",
        variant === "grid" ? "flex-col" : "flex-row",
      )}
    >
      <div
        className={cn(
          "shrink-0 animate-pulse bg-subtle",
          variant === "grid" ? "aspect-[4/3] w-full" : "aspect-[4/3] w-56 sm:w-64",
        )}
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded-xl bg-subtle" />
        <div className="h-3 w-1/3 animate-pulse rounded-xl bg-subtle" />
        <div className="mt-auto h-6 w-1/4 animate-pulse rounded-xl bg-subtle" />
      </div>
    </div>
  );
}
