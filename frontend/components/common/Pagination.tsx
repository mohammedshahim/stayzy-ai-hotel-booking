"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-subtle hover:text-text-secondary disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-xl text-sm transition-colors",
            page === currentPage
              ? "border border-accent-border bg-accent-dim text-accent-text"
              : "text-text-secondary hover:bg-subtle",
          )}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-subtle hover:text-text-secondary disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
