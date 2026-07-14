import { TableCell, TableRow } from "@/components/ui/table";

const PLACEHOLDER_ROW_COUNT = 6;

export function BookingsTableSkeleton() {
  return (
    <>
      {Array.from({ length: PLACEHOLDER_ROW_COUNT }, (_, index) => (
        <TableRow key={index} className="border-b border-border-default last:border-0">
          <TableCell className="px-4 py-3">
            <div className="flex flex-col gap-1.5">
              <div className="h-4 w-28 animate-pulse rounded-xl bg-subtle" />
              <div className="h-3 w-36 animate-pulse rounded-xl bg-subtle" />
            </div>
          </TableCell>
          <TableCell className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="size-10 shrink-0 animate-pulse rounded-lg bg-subtle" />
              <div className="flex flex-col gap-1.5">
                <div className="h-4 w-28 animate-pulse rounded-xl bg-subtle" />
                <div className="h-3 w-20 animate-pulse rounded-xl bg-subtle" />
              </div>
            </div>
          </TableCell>
          <TableCell className="px-4 py-3">
            <div className="h-4 w-24 animate-pulse rounded-xl bg-subtle" />
          </TableCell>
          <TableCell className="px-4 py-3">
            <div className="h-4 w-32 animate-pulse rounded-xl bg-subtle" />
          </TableCell>
          <TableCell className="px-4 py-3">
            <div className="h-4 w-16 animate-pulse rounded-xl bg-subtle" />
          </TableCell>
          <TableCell className="px-4 py-3">
            <div className="h-6 w-20 animate-pulse rounded-full bg-subtle" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
