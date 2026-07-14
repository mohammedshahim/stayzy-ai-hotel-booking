const PLACEHOLDER_COUNT = 6;

export function FavoritesSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
        <div
          key={index}
          className="flex flex-col overflow-hidden rounded-2xl border border-border-default bg-elevated shadow-card"
        >
          <div className="aspect-[4/3] w-full animate-pulse bg-subtle" />
          <div className="flex flex-col gap-2 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded-xl bg-subtle" />
            <div className="h-3 w-1/3 animate-pulse rounded-xl bg-subtle" />
            <div className="mt-auto h-6 w-1/4 animate-pulse rounded-xl bg-subtle" />
          </div>
        </div>
      ))}
    </div>
  );
}
