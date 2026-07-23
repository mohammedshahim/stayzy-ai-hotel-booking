"use client";

import { useCallback, useState } from "react";
import { SparklesIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSmartSearch } from "@/features/search/hooks/useSmartSearch";
import { describeExtraction, toSearchState } from "@/features/search/lib/extraction";
import type { SearchCatalogs } from "@/features/search/hooks/useSearchCatalogs";
import type { SearchFilterExtraction, SearchState } from "@/features/search/types";

type Props = {
  onApply: (partial: Partial<SearchState>) => void;
  catalogs: SearchCatalogs;
};

const MAX_PROMPT_LENGTH = 500;

export function SmartSearchBox({ onApply, catalogs }: Props) {
  const [prompt, setPrompt] = useState("");

  const handleExtracted = useCallback(
    (extraction: SearchFilterExtraction) => onApply(toSearchState(extraction.filters)),
    [onApply],
  );

  const { extraction, isLoading, hasFailed, extract, dismiss } = useSmartSearch(handleExtracted);

  const trimmedPrompt = prompt.trim();
  const applied = extraction ? describeExtraction(extraction.filters, catalogs) : [];
  const ignored = extraction?.unmapped ?? [];

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (trimmedPrompt) extract(trimmedPrompt);
  }

  return (
    <form onSubmit={handleSubmit} className="border-b border-border-default pb-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-medium text-text-primary">
        <SparklesIcon className="h-4 w-4 text-accent-text" strokeWidth={1.5} />
        Describe your stay
      </p>

      <Textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        maxLength={MAX_PROMPT_LENGTH}
        disabled={isLoading}
        placeholder="5 star hotel in Paris with a spa, under $300 a night…"
        className="min-h-20 rounded-xl border-border-default bg-subtle px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus-visible:border-accent-border focus-visible:ring-accent-border"
      />

      <Button
        type="submit"
        disabled={!trimmedPrompt || isLoading}
        className="mt-3 h-9 w-full rounded-xl bg-accent-primary px-4 font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? "Reading your search…" : hasFailed ? "Try again" : "Search with AI"}
      </Button>

      {isLoading && (
        <p className="mt-3 text-xs text-text-muted">This can take up to a minute.</p>
      )}

      {hasFailed && (
        <p className="mt-3 text-xs text-error">
          Couldn&apos;t read that just now. Try again, or use the filters below.
        </p>
      )}

      {extraction && (
        <div className="mt-4 rounded-xl border border-border-default bg-elevated p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-text-primary">
              {applied.length > 0 ? "Applied to your search" : "Nothing matched a filter"}
            </p>
            <button type="button" onClick={dismiss} aria-label="Dismiss extraction summary">
              <XIcon className="h-3 w-3 text-text-muted transition-colors hover:text-text-primary" />
            </button>
          </div>

          {applied.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {applied.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-accent-border bg-accent-dim px-2 py-0.5 text-xs text-accent-text"
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          {ignored.length > 0 && (
            <p className="mt-2 text-xs text-text-muted">Ignored: {ignored.join(", ")}</p>
          )}

          <p className="mt-2 text-xs text-text-muted">
            AI-interpreted. Adjust anything below, or remove a chip beside the results.
          </p>
        </div>
      )}
    </form>
  );
}
