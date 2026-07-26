import type { ExtractedSearchFilters } from "@/features/search/types";

// Amenity entries here are catalog *names*, not ids — agent/ never handles a uuid.
export type ChatChipFilters = ExtractedSearchFilters;

export type ChatAction =
  | { kind: "navigate"; label: string; filters: ChatChipFilters }
  | { kind: "open_hotel"; label: string; hotelId: string; hotelName: string }
  | { kind: "compare"; label: string; hotelId: string; hotelName: string }
  | { kind: "checkout"; label: string; path: string };

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions: ChatAction[];
};

export type PageContext = {
  path: string;
  hotelId?: string;
  hotelName?: string;
  summary?: string;
};

export type ConfirmLine = {
  label: string;
  value: string;
};

export type PendingConfirmation = {
  action: string;
  title: string;
  lines: ConfirmLine[];
  confirmLabel: string;
};

export type ChatSessionSummary = {
  id: string;
  title: string;
  lastMessageAt: string;
  endedAt: string | null;
};

export type ChatStreamEvent =
  | { type: "token"; text: string; id: string }
  | { type: "drop"; id: string }
  | { type: "tool_start"; tool: string }
  | { type: "tool_end"; tool: string; summary: string }
  | ({ type: "action" } & ChatAction)
  | ({ type: "confirm" } & PendingConfirmation)
  | { type: "done" }
  | { type: "error"; message: string };
