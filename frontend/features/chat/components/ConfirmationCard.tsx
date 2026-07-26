"use client";

import { ShieldCheckIcon } from "lucide-react";

import type { PendingConfirmation } from "@/features/chat/types";

type Props = {
  pending: PendingConfirmation;
  isDeciding: boolean;
  onDecide: (approved: boolean) => void;
};

export function ConfirmationCard({ pending, isDeciding, onDecide }: Props) {
  return (
    <div className="rounded-2xl border border-border-default bg-elevated p-5 shadow-card">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-dim text-accent-text">
          <ShieldCheckIcon className="h-3.5 w-3.5" />
        </span>
        <p className="text-sm font-medium text-text-primary">{pending.title}</p>
      </div>

      <dl className="mt-4 space-y-2">
        {pending.lines.map((line) => (
          <div key={line.label} className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-text-muted">{line.label}</dt>
            <dd className="text-right text-sm text-text-primary">{line.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={isDeciding}
          onClick={() => onDecide(true)}
          className="h-9 rounded-xl bg-accent-primary px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover hover:shadow-accent disabled:cursor-not-allowed disabled:opacity-70 sm:flex-1"
        >
          {pending.confirmLabel}
        </button>
        <button
          type="button"
          disabled={isDeciding}
          onClick={() => onDecide(false)}
          className="h-9 rounded-xl border border-border-default bg-elevated px-4 text-sm font-medium text-text-secondary transition-colors hover:border-border-subtle hover:bg-subtle hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-70 sm:flex-1"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
