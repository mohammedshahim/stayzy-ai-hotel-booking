import type { BookingStatus } from "@/features/booking/types";

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  confirmed: { label: "Confirmed", className: "border-success/20 bg-success-dim text-success" },
  pending_payment: { label: "Pending Payment", className: "border-warning/20 bg-warning-dim text-warning" },
  completed: { label: "Completed", className: "border-info/20 bg-info-dim text-info" },
  cancelled: { label: "Cancelled", className: "border-neutral/20 bg-neutral-dim text-neutral" },
  failed: { label: "Failed", className: "border-error/20 bg-error-dim text-error" },
};

type Props = {
  status: BookingStatus;
};

export function BookingStatusBadge({ status }: Props) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
