export function HotelDetailsSkeleton() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-3">
        <div className="aspect-[16/9] w-full animate-pulse rounded-2xl bg-subtle" />
        <div className="flex gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-20 w-28 shrink-0 animate-pulse rounded-xl bg-subtle" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-4 w-32 animate-pulse rounded-xl bg-subtle" />
        <div className="h-8 w-2/3 animate-pulse rounded-xl bg-subtle" />
        <div className="h-4 w-1/2 animate-pulse rounded-xl bg-subtle" />
      </div>
      <div className="h-24 w-full animate-pulse rounded-2xl bg-subtle" />
      <div className="h-40 w-full animate-pulse rounded-2xl bg-subtle" />
      <div className="h-32 w-full animate-pulse rounded-2xl bg-subtle" />
    </div>
  );
}
