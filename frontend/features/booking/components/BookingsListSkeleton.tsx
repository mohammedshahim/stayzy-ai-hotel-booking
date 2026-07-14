const PLACEHOLDER_COUNT = 6;

export function BookingsListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
        <div
          key={index}
          className="flex flex-col overflow-hidden rounded-2xl border border-border-default bg-elevated shadow-card sm:flex-row"
        >
          <div className="aspect-[4/3] w-full shrink-0 animate-pulse bg-subtle sm:aspect-square sm:w-40" />
          <div className="flex flex-1 flex-col gap-2 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded-xl bg-subtle" />
            <div className="h-3 w-1/3 animate-pulse rounded-xl bg-subtle" />
            <div className="mt-auto h-4 w-1/2 animate-pulse rounded-xl bg-subtle" />
          </div>
        </div>
      ))}
    </div>
  );
}
