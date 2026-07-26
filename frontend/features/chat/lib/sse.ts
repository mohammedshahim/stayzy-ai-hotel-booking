import type { ChatStreamEvent } from "@/features/chat/types";

export function parseFrames(buffer: string): { events: ChatStreamEvent[]; rest: string } {
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
