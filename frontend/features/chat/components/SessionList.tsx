"use client";

import { formatDistanceToNow } from "date-fns";
import { PlusIcon } from "lucide-react";

import type { ChatSessionSummary } from "@/features/chat/types";

type Props = {
  sessions: ChatSessionSummary[];
  activeId: string | null;
  onOpen: (id: string) => void;
  onNewChat: () => void;
};

const ITEM_CLASS =
  "flex h-10 w-full items-center rounded-xl px-3 text-left text-sm transition-colors";

export function SessionList({ sessions, activeId, onOpen, onNewChat }: Props) {
  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <button
        type="button"
        onClick={onNewChat}
        className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border-default bg-elevated px-4 text-sm font-medium text-text-secondary transition-colors hover:border-border-subtle hover:bg-subtle hover:text-text-primary"
      >
        <PlusIcon className="h-4 w-4" />
        New chat
      </button>

      {sessions.length === 0 ? (
        <p className="px-3 text-xs text-text-muted">Your conversations will appear here.</p>
      ) : (
        <div className="scrollbar-none flex-1 space-y-1 overflow-y-auto">
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => onOpen(session.id)}
              className={
                session.id === activeId
                  ? `${ITEM_CLASS} border border-accent-border bg-accent-dim text-accent-text`
                  : `${ITEM_CLASS} text-text-secondary hover:bg-subtle hover:text-text-primary`
              }
            >
              <span className="min-w-0 flex-1 truncate">{session.title}</span>
              <span className="ml-2 shrink-0 text-xs text-text-muted">
                {formatDistanceToNow(new Date(session.lastMessageAt), { addSuffix: false })}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
