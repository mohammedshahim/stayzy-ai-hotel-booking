"use client";

import { SparklesIcon } from "lucide-react";

import type { ReactNode } from "react";

export function ChatBubble({ role, children }: { role: "user" | "assistant"; children: ReactNode }) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-accent-primary px-3.5 py-2.5 text-sm whitespace-pre-wrap text-white">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-dim text-accent-text">
        <SparklesIcon className="h-3.5 w-3.5" />
      </span>
      <div className="max-w-[85%] rounded-2xl border border-border-default bg-elevated px-3.5 py-2.5 text-sm text-text-primary">
        {children}
      </div>
    </div>
  );
}

export function ChatTypingBubble() {
  return (
    <ChatBubble role="assistant">
      <span className="shimmer" aria-label="The assistant is thinking">
        Thinking…
      </span>
    </ChatBubble>
  );
}
