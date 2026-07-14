const ROW_LABEL_CLASS = "sticky left-0 z-10 whitespace-nowrap bg-surface px-4 py-3 text-sm font-medium text-text-secondary";
const CELL_CLASS = "min-w-[16rem] px-4 py-3 align-top";
const ROW_LABELS = ["Price", "Rating", "Amenities", "Cancellation"];

type Props = {
  columnCount: number;
};

export function CompareSkeleton({ columnCount }: Props) {
  const columns = Array.from({ length: columnCount });

  return (
    <div className="overflow-x-auto rounded-2xl border border-border-default bg-surface">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border-default">
            <th className={ROW_LABEL_CLASS}>Hotel</th>
            {columns.map((_, index) => (
              <th key={index} className={CELL_CLASS}>
                <div className="flex flex-col gap-2">
                  <div className="aspect-[4/3] w-full animate-pulse rounded-xl bg-subtle" />
                  <div className="h-4 w-2/3 animate-pulse rounded-xl bg-subtle" />
                  <div className="h-3 w-1/3 animate-pulse rounded-xl bg-subtle" />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROW_LABELS.map((label, rowIndex) => (
            <tr key={label} className={rowIndex < ROW_LABELS.length - 1 ? "border-b border-border-default" : ""}>
              <td className={ROW_LABEL_CLASS}>{label}</td>
              {columns.map((_, index) => (
                <td key={index} className={CELL_CLASS}>
                  <div className="h-4 w-3/4 animate-pulse rounded-xl bg-subtle" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
