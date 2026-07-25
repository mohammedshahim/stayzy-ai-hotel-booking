"use client";

import { useCallback, useRef, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { ChatAction, ChatMessage, ChatStreamEvent, PageContext } from "@/features/chat/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type ThreadResponse = { messages: ChatMessage[] };

export type ChatStream = {
  messages: ChatMessage[];
  reply: string;
  replyActions: ChatAction[];
  activeTool: string | null;
  isStreaming: boolean;
  error: string | null;
  hydrate: () => void;
  send: (text: string, context: PageContext) => void;
  newChat: () => void;
};

function parseFrames(buffer: string): { events: ChatStreamEvent[]; rest: string } {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  const events: ChatStreamEvent[] = [];

  for (const part of parts) {
    const line = part.trim();
    if (!line.startsWith("data:")) continue;
    try {
      events.push(JSON.parse(line.slice(5).trim()) as ChatStreamEvent);
    } catch {
      // A frame we cannot read is dropped rather than ending the turn.
    }
  }

  return { events, rest };
}

function toAction(event: { type: "action" } & ChatAction): ChatAction {
  if (event.kind === "navigate") {
    return { kind: "navigate", label: event.label, filters: event.filters };
  }
  return {
    kind: event.kind,
    label: event.label,
    hotelId: event.hotelId,
    hotelName: event.hotelName,
  };
}

export function useChatStream(): ChatStream {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [parts, setParts] = useState<Map<string, string>>(new Map());
  const [replyActions, setReplyActions] = useState<ChatAction[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasHydrated = useRef(false);

  const hydrate = useCallback(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    apiClient
      .get<ThreadResponse>("/ai/chat/widget/session")
      .then((response) => {
        if (response.success) setMessages(response.data.messages);
      })
      .catch((cause: unknown) => {
        console.error("[useChatStream/hydrate]", cause);
      });
  }, []);

  const send = useCallback((text: string, context: PageContext) => {
    setError(null);
    setParts(new Map());
    setReplyActions([]);
    setActiveTool(null);
    setIsStreaming(true);
    setMessages((current) => [
      ...current,
      { id: `local-${current.length}`, role: "user", content: text, actions: [] },
    ]);

    const surviving = new Map<string, string>();
    const actions: ChatAction[] = [];

    void (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/ai/chat/widget`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ message: text, context }),
        });

        if (!response.ok || !response.body) {
          setError("The assistant is unavailable right now.");
          setIsStreaming(false);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const { events, rest } = parseFrames(buffer);
          buffer = rest;

          for (const event of events) {
            switch (event.type) {
              case "token":
                surviving.set(event.id, (surviving.get(event.id) ?? "") + event.text);
                setParts(new Map(surviving));
                break;
              case "drop":
                surviving.delete(event.id);
                setParts(new Map(surviving));
                break;
              case "tool_start":
                setActiveTool(event.tool);
                break;
              case "tool_end":
                setActiveTool(null);
                break;
              case "action":
                actions.push(toAction(event));
                setReplyActions([...actions]);
                break;
              case "error":
                setError(event.message);
                break;
              default:
                break;
            }
          }
        }
      } catch (cause: unknown) {
        console.error("[useChatStream/send]", cause);
        setError("The assistant is unavailable right now.");
      } finally {
        const content = [...surviving.values()].join("\n\n").trim();
        if (content) {
          setMessages((current) => [
            ...current,
            {
              id: `local-reply-${current.length}`,
              role: "assistant",
              content,
              actions: [...actions],
            },
          ]);
        }
        setParts(new Map());
        setReplyActions([]);
        setActiveTool(null);
        setIsStreaming(false);
      }
    })();
  }, []);

  const newChat = useCallback(() => {
    setMessages([]);
    setParts(new Map());
    setReplyActions([]);
    setError(null);

    apiClient.post("/ai/chat/widget/session/end").catch((cause: unknown) => {
      console.error("[useChatStream/newChat]", cause);
    });
  }, []);

  return {
    messages,
    reply: [...parts.values()].join("\n\n"),
    replyActions,
    activeTool,
    isStreaming,
    error,
    hydrate,
    send,
    newChat,
  };
}
