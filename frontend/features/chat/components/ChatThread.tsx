"use client";

import { useEffect, useRef } from "react";
import { Loader2Icon } from "lucide-react";

import type { SearchCatalogs } from "@/features/search/hooks/useSearchCatalogs";
import { ChatActionChip } from "@/features/chat/components/ChatActionChip";
import { ChatBubble, ChatTypingBubble } from "@/features/chat/components/ChatBubble";
import { ChatCheckoutButton } from "@/features/chat/components/ChatCheckoutButton";
import { ChatMarkdown } from "@/features/chat/components/ChatMarkdown";
import { ConfirmationCard } from "@/features/chat/components/ConfirmationCard";
import type { ChatAction, ChatMessage, PendingConfirmation } from "@/features/chat/types";

const WIDGET_PROMPTS = [
  "Find me a 4-star hotel in Paris",
  "Which of these has a gym?",
  "Somewhere cheaper for the same dates",
];

const TOOL_LABELS: Record<string, string> = {
  SearchHotels: "Searching hotels",
  GetHotelDetails: "Looking up the hotel",
  GetRoomTypes: "Checking rooms and prices",
  CompareHotels: "Comparing hotels",
  GetHotelReviews: "Reading reviews",
  ListMyBookings: "Finding your bookings",
  ListMyFavorites: "Finding your favorites",
  AddFavorite: "Saving to favorites",
  BookRoom: "Preparing your booking",
  CancelBooking: "Preparing the cancellation",
  WriteReview: "Preparing your review",
  ProposeSearch: "Preparing a link",
  ProposeHotel: "Preparing a link",
  ProposeCompare: "Preparing a link",
};

const SCROLL_LOCK_THRESHOLD = 60;

type ChatThreadProps = {
  messages: ChatMessage[];
  reply: string;
  replyActions: ChatAction[];
  activeTool: string | null;
  isStreaming: boolean;
  error: string | null;
  catalogs: SearchCatalogs;
  welcome?: string;
  prompts?: string[];
  pending?: PendingConfirmation | null;
  isDeciding?: boolean;
  onDecide?: (approved: boolean) => void;
  onRetry?: () => void;
  onSuggestion: (prompt: string) => void;
};

function ActionRow({ actions, catalogs }: { actions: ChatAction[]; catalogs: SearchCatalogs }) {
  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pl-8">
      {actions.map((action) =>
        action.kind === "checkout" ? (
          <ChatCheckoutButton
            key={`${action.kind}-${action.label}`}
            label={action.label}
            path={action.path}
          />
        ) : (
          <ChatActionChip
            key={`${action.kind}-${action.label}`}
            action={action}
            catalogs={catalogs}
          />
        ),
      )}
    </div>
  );
}

export function ChatThread({
  messages,
  reply,
  replyActions,
  activeTool,
  isStreaming,
  error,
  catalogs,
  welcome = "Ask me about hotels, prices or amenities — I can search the site for you.",
  prompts = WIDGET_PROMPTS,
  pending = null,
  isDeciding = false,
  onDecide,
  onRetry,
  onSuggestion,
}: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPinnedToBottom = useRef(true);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !isPinnedToBottom.current) return;
    element.scrollTop = element.scrollHeight;
  }, [messages, reply, activeTool, error, pending]);

  function handleScroll() {
    const element = scrollRef.current;
    if (!element) return;
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    isPinnedToBottom.current = distanceFromBottom <= SCROLL_LOCK_THRESHOLD;
  }

  const isEmpty = messages.length === 0 && !isStreaming && !error && !pending;
  const toolLabel = activeTool ? TOOL_LABELS[activeTool] : undefined;

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="scroll-fade scrollbar-none flex-1 overflow-y-auto p-4"
    >
      <div className="mx-auto w-full max-w-3xl space-y-3">
        {isEmpty ? (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">{welcome}</p>
            <div className="flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onSuggestion(prompt)}
                  className="rounded-full border border-accent-border bg-accent-dim px-2.5 py-1 text-xs text-accent-text transition-colors hover:bg-accent-dim/70"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <ChatBubble role={message.role}>
              {message.role === "assistant" ? (
                <ChatMarkdown content={message.content} />
              ) : (
                message.content
              )}
            </ChatBubble>
            {message.role === "assistant" ? (
              <ActionRow actions={message.actions} catalogs={catalogs} />
            ) : null}
          </div>
        ))}

        {reply ? (
          <div className="space-y-2">
            <ChatBubble role="assistant">
              <ChatMarkdown content={reply} />
            </ChatBubble>
            <ActionRow actions={replyActions} catalogs={catalogs} />
          </div>
        ) : null}

        {isStreaming && !reply ? <ChatTypingBubble /> : null}

        {toolLabel ? (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-subtle px-2.5 py-1 text-xs text-text-muted">
            <Loader2Icon className="h-3 w-3 animate-spin" />
            {toolLabel}
          </div>
        ) : null}

        {pending && onDecide ? (
          <ConfirmationCard pending={pending} isDeciding={isDeciding} onDecide={onDecide} />
        ) : null}

        {error ? (
          <p className="flex flex-wrap items-center gap-2 text-xs text-error">
            {error}
            {onRetry && !isStreaming ? (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-full border border-error/40 px-2 py-0.5 transition-colors hover:bg-error-dim"
              >
                Try again
              </button>
            ) : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}
