import { CalendarClockIcon, ShieldCheckIcon } from "lucide-react";

type Props = {
  checkInTime: string;
  checkOutTime: string;
  freeCancellation: boolean;
  cancellationPolicy: string;
};

export function PoliciesSection({ checkInTime, checkOutTime, freeCancellation, cancellationPolicy }: Props) {
  return (
    <div className="rounded-2xl border border-border-default bg-elevated p-5 shadow-card">
      <h2 className="text-lg font-semibold text-text-primary">Policies</h2>
      <div className="mt-4 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <CalendarClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent-text" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium text-text-primary">Check-in / Check-out</p>
            <p className="text-sm text-text-secondary">
              Check-in from {checkInTime} &middot; Check-out by {checkOutTime}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent-text" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium text-text-primary">
              {freeCancellation ? "Free cancellation" : "Cancellation policy"}
            </p>
            <p className="text-sm text-text-secondary">{cancellationPolicy}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
