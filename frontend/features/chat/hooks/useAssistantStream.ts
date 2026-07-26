"use client";

import { useCallback, useRef, useState } from "react";

import { apiClient } from "@/lib/api-client";
import { toAction } from "@/features/chat/lib/chat-actions";
import { parseFrames } from "@/features/chat/lib/sse";
import type {
  ChatAction,
  ChatMessage,
  ChatSessionSummary,
  PendingConfirmation,
} from "@/features/chat/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const UNAVAILABLE = "The assistant is unavailable right now.";
const STILL_WAITING = "Answer the confirmation on screen first.";

type SessionsResponse = { sessions: ChatSessionSummary[] };
type ThreadResponse = { messages: ChatMessage[] };
type PendingResponse = { pending: PendingConfirmation | null };

type TurnBody = {
  sessionId?: string;
  message?: string;
  decision?: { approved: boolean };
};

export type AssistantStream = {
  sessions: ChatSessionSummary[];
  sessionId: string | null;
  messages: ChatMessage[];
  reply: string;
  replyActions: ChatAction[];
  activeTool: string | null;
  pending: PendingConfirmation | null;
  isStreaming: boolean;
  isDeciding: boolean;
  isLoading: boolean;
  error: string | null;
  hydrate: () => void;
  openSession: (id: string) => void;
  send: (text: string) => void;
  decide: (approved: boolean) => void;
  retry: () => void;
  newChat: () => void;
};

export function useAssistantStream(): AssistantStream {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [parts, setParts] = useState<Map<string, string>>(new Map());
  const [replyActions, setReplyActions] = useState<ChatAction[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDeciding, setIsDeciding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasHydrated = useRef(false);
  const lastTurn = useRef<TurnBody | null>(null);

  const loadSessions = useCallback(async (): Promise<ChatSessionSummary[]> => {
    const response = await apiClient.get<SessionsResponse>("/ai/chat/assistant/sessions");
    if (!response.success) return [];

    setSessions(response.data.sessions);
    return response.data.sessions;
  }, []);

  // A reply only ever moves its own session to the top, which the client can do itself.
  const touchSession = useCallback((id: string) => {
    const now = new Date().toISOString();
    setSessions((current) =>
      current
        .map((session) => (session.id === id ? { ...session, lastMessageAt: now } : session))
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()),
    );
  }, []);

  const loadPending = useCallback(async (id: string | null): Promise<void> => {
    const query = id ? `?sessionId=${id}` : "";
    const response = await apiClient.get<PendingResponse>(`/ai/chat/assistant/pending${query}`);
    setPending(response.success ? response.data.pending : null);
  }, []);

  const loadThread = useCallback(
    async (id: string): Promise<void> => {
      const response = await apiClient.get<ThreadResponse>(`/ai/chat/assistant/sessions/${id}`);
      setMessages(response.success ? response.data.messages : []);
      await loadPending(id);
    },
    [loadPending],
  );

  const hydrate = useCallback(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    void (async () => {
      try {
        const rows = await loadSessions();
        const landing = rows.find((session) => session.endedAt === null);
        if (landing) {
          setSessionId(landing.id);
          await loadThread(landing.id);
        }
      } catch (cause: unknown) {
        console.error("[useAssistantStream/hydrate]", cause);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [loadSessions, loadThread]);

  const openSession = useCallback(
    (id: string) => {
      if (id === sessionId) return;

      setSessionId(id);
      setMessages([]);
      setParts(new Map());
      setReplyActions([]);
      setPending(null);
      setError(null);
      setIsLoading(true);

      void (async () => {
        try {
          await loadThread(id);
        } catch (cause: unknown) {
          console.error("[useAssistantStream/openSession]", cause);
          setError(UNAVAILABLE);
        } finally {
          setIsLoading(false);
        }
      })();
    },
    [loadThread, sessionId],
  );

  const runTurn = useCallback(
    (body: TurnBody) => {
      setError(null);
      setParts(new Map());
      setReplyActions([]);
      setActiveTool(null);

      const surviving = new Map<string, string>();
      const actions: ChatAction[] = [];
      let confirmed: PendingConfirmation | null = null;
      let streamed = false;

      void (async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/ai/chat/assistant`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(body),
          });

          if (!response.ok || !response.body) {
            setError(response.status === 409 ? STILL_WAITING : UNAVAILABLE);
            return;
          }

          streamed = true;
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
                case "confirm":
                  confirmed = {
                    action: event.action,
                    title: event.title,
                    lines: event.lines,
                    confirmLabel: event.confirmLabel,
                  };
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
          console.error("[useAssistantStream/runTurn]", cause);
          setError(UNAVAILABLE);
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
          setIsDeciding(false);

          // A turn that never streamed leaves the pause untouched, so ask rather than assume.
          if (streamed) setPending(confirmed);
          else await loadPending(body.sessionId ?? null);

          // Only a turn that named no session can have created one, and only then is
          // the list unknown; every other turn just moved a row this client already has.
          if (body.sessionId) {
            touchSession(body.sessionId);
            return;
          }

          const rows = await loadSessions().catch(() => [] as ChatSessionSummary[]);
          const active = rows.find((session) => session.endedAt === null);
          if (active) setSessionId(active.id);
        }
      })();
    },
    [loadPending, loadSessions, touchSession],
  );

  const send = useCallback(
    (text: string) => {
      lastTurn.current = { message: text };
      setIsStreaming(true);
      setMessages((current) => [
        ...current,
        { id: `local-${current.length}`, role: "user", content: text, actions: [] },
      ]);
      runTurn({ sessionId: sessionId ?? undefined, message: text });
    },
    [runTurn, sessionId],
  );

  const decide = useCallback(
    (approved: boolean) => {
      lastTurn.current = { decision: { approved } };
      setIsDeciding(true);
      setIsStreaming(true);
      setPending(null);
      runTurn({ sessionId: sessionId ?? undefined, decision: { approved } });
    },
    [runTurn, sessionId],
  );

  // Replayed as a fresh turn, which is what retyping would do — a repeated decision is
  // a no-op once the pause is gone, so a retry can never commit an action twice.
  const retry = useCallback(() => {
    const previous = lastTurn.current;
    if (!previous) return;

    setError(null);
    if (previous.message !== undefined) send(previous.message);
    else if (previous.decision) decide(previous.decision.approved);
  }, [decide, send]);

  const newChat = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setParts(new Map());
    setReplyActions([]);
    setPending(null);
    setError(null);

    void (async () => {
      try {
        await apiClient.post("/ai/chat/assistant/session/end");
        await loadSessions();
      } catch (cause: unknown) {
        console.error("[useAssistantStream/newChat]", cause);
      }
    })();
  }, [loadSessions]);

  return {
    sessions,
    sessionId,
    messages,
    reply: [...parts.values()].join("\n\n"),
    replyActions,
    activeTool,
    pending,
    isStreaming,
    isDeciding,
    isLoading,
    error,
    hydrate,
    openSession,
    send,
    decide,
    retry,
    newChat,
  };
}
