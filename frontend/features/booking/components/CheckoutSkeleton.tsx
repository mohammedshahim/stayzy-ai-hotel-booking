export function CheckoutSkeleton() {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-6 py-8 lg:grid-cols-[1fr_20rem]">
      <div className="h-64 w-full animate-pulse rounded-2xl bg-subtle" />
      <div className="h-80 w-full animate-pulse rounded-2xl bg-subtle" />
    </div>
  );
}
