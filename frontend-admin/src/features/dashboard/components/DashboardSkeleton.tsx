const FEED_ROW_COUNT = 4;

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border-default bg-elevated p-5 shadow-card">
      <div className="h-8 w-20 animate-pulse rounded-xl bg-subtle" />
      <div className="mt-2 h-3 w-24 animate-pulse rounded-xl bg-subtle" />
    </div>
  );
}

function SectionCardSkeleton({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-default bg-surface p-6">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      <div className="flex flex-col gap-2">
        {Array.from({ length: FEED_ROW_COUNT }, (_, index) => (
          <div key={index} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5">
            <div className="h-4 w-32 animate-pulse rounded-xl bg-subtle" />
            <div className="h-4 w-16 animate-pulse rounded-xl bg-subtle" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCardSkeleton title="Top hotels" />
        <SectionCardSkeleton title="Recent bookings" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCardSkeleton title="Upcoming check-ins (next 7 days)" />
        <SectionCardSkeleton title="Upcoming check-outs (next 7 days)" />
      </div>
    </>
  );
}
