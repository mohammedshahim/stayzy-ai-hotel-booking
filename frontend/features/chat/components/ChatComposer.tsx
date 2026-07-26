"use client";

import { useState, type FormEvent } from "react";
import { SendHorizontalIcon } from "lucide-react";

import { Input } from "@/components/ui/input";

const MAX_CHAT_MESSAGE_LENGTH = 1000;

export function ChatComposer({
  isStreaming,
  placeholder = "Ask about hotels…",
  className = "p-3",
  onSend,
}: {
  isStreaming: boolean;
  placeholder?: string;
  className?: string;
  onSend: (text: string) => void;
}) {
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = value.trim();
    if (!text || isStreaming) return;
    setValue("");
    onSend(text);
  }

  return (
    <form onSubmit={handleSubmit} className={`border-t border-border-default ${className}`}>
      <div className="mx-auto flex w-full max-w-3xl items-center gap-2">
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={MAX_CHAT_MESSAGE_LENGTH}
          disabled={isStreaming}
          placeholder={placeholder}
          aria-label="Message the assistant"
          className="h-10 rounded-xl border-border-default bg-subtle px-3 text-text-primary placeholder:text-text-muted focus-visible:border-accent-border focus-visible:ring-accent-border"
        />
        <button
          type="submit"
          disabled={isStreaming || !value.trim()}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-primary text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          <SendHorizontalIcon className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
