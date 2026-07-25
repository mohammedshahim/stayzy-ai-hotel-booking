"use client";

import { useRouter } from "next/navigation";
import { ArrowRightIcon, CheckIcon } from "lucide-react";

import { useCompareSelection } from "@/features/compare/hooks/useCompareSelection";
import type { SearchCatalogs } from "@/features/search/hooks/useSearchCatalogs";
import { chipToSearchHref } from "@/features/chat/lib/chat-actions";
import type { ChatAction } from "@/features/chat/types";

const CHIP_CLASS =
  "inline-flex items-center gap-1.5 rounded-full border border-accent-border bg-accent-dim px-2.5 py-1 text-xs text-accent-text transition-colors hover:bg-accent-dim/70 disabled:opacity-60";

export function ChatActionChip({ action, catalogs }: { action: ChatAction; catalogs: SearchCatalogs }) {
  const router = useRouter();
  const { isSelected, isFull, add, remove } = useCompareSelection();

  if (action.kind === "navigate") {
    return (
      <button
        type="button"
        className={CHIP_CLASS}
        onClick={() => router.push(chipToSearchHref(action.filters, catalogs))}
      >
        {action.label}
        <ArrowRightIcon className="h-3 w-3" />
      </button>
    );
  }

  if (action.kind === "open_hotel") {
    return (
      <button
        type="button"
        className={CHIP_CLASS}
        onClick={() => router.push(`/hotels/${action.hotelId}`)}
      >
        {action.label}
        <ArrowRightIcon className="h-3 w-3" />
      </button>
    );
  }

  const selected = isSelected(action.hotelId);

  return (
    <button
      type="button"
      className={CHIP_CLASS}
      disabled={!selected && isFull}
      onClick={() => (selected ? remove(action.hotelId) : add(action.hotelId))}
    >
      {selected ? `${action.hotelName} added` : action.label}
      {selected ? <CheckIcon className="h-3 w-3" /> : <ArrowRightIcon className="h-3 w-3" />}
    </button>
  );
}
