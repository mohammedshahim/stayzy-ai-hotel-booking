"use client";

import { PlusIcon, SparklesIcon, XIcon } from "lucide-react";

import { useSearchCatalogs } from "@/features/search/hooks/useSearchCatalogs";
import { ChatComposer } from "@/features/chat/components/ChatComposer";
import { ChatThread } from "@/features/chat/components/ChatThread";
import type { ChatStream } from "@/features/chat/hooks/useChatStream";
import type { PageContext } from "@/features/chat/types";

type ChatPanelProps = {
  chat: ChatStream;
  context: PageContext;
  label: string;
  onClose: () => void;
};

export function ChatPanel({ chat, context, label, onClose }: ChatPanelProps) {
  const catalogs = useSearchCatalogs();

  return (
    <div className="fixed inset-0 z-40 flex flex-col border-border-default bg-surface sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[70vh] sm:w-96 sm:rounded-2xl sm:border sm:shadow-elevated">
      <div className="flex items-start gap-2 border-b border-border-default px-4 py-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-dim text-accent-text">
          <SparklesIcon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary">Assistant</p>
          <p className="truncate text-xs text-text-muted">Looking at {label}</p>
        </div>
        <button
          type="button"
          onClick={chat.newChat}
          aria-label="Start a new chat"
          className="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-subtle hover:text-text-secondary"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the assistant"
          className="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-subtle hover:text-text-secondary"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <ChatThread
        messages={chat.messages}
        reply={chat.reply}
        replyActions={chat.replyActions}
        activeTool={chat.activeTool}
        isStreaming={chat.isStreaming}
        error={chat.error}
        catalogs={catalogs}
        onSuggestion={(prompt) => chat.send(prompt, context)}
      />

      <ChatComposer isStreaming={chat.isStreaming} onSend={(text) => chat.send(text, context)} />
    </div>
  );
}
