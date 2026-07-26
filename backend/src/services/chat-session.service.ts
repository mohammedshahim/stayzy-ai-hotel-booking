import {
  endActiveSession,
  findActiveSession,
  findSessionMessages,
  findSessionOwner,
  insertMessage,
  insertSession,
  listSessions,
  type ChatFeature,
} from "../queries/chat.queries";
import type { ChatAction } from "../types/chat.schemas";

const WIDGET: ChatFeature = "widget";
const CHATBOT: ChatFeature = "chatbot";
const TITLE_MAX_LENGTH = 60;

export interface ChatThreadMessage {
  id: string;
  role: string;
  content: string;
  actions: ChatAction[];
  createdAt: string;
}

export interface ChatSessionSummary {
  id: string;
  title: string;
  lastMessageAt: string;
  endedAt: string | null;
}

async function readThread(sessionId: string): Promise<ChatThreadMessage[]> {
  const messages = await findSessionMessages(sessionId);
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    actions: (message.actionsJson as ChatAction[] | null) ?? [],
    createdAt: message.createdAt,
  }));
}

function toTitle(message: string): string {
  const trimmed = message.trim();
  if (trimmed.length <= TITLE_MAX_LENGTH) return trimmed;
  return `${trimmed.slice(0, TITLE_MAX_LENGTH - 1).trimEnd()}…`;
}

async function resolveActiveSession(userId: string, feature: ChatFeature, title: string) {
  const existing = await findActiveSession(userId, feature);
  if (existing) return existing;

  try {
    return await insertSession({ userId, feature, title });
  } catch (error) {
    const raced = await findActiveSession(userId, feature);
    if (!raced) throw error;
    return raced;
  }
}

export async function startWidgetSession(userId: string, message: string): Promise<string> {
  const session = await resolveActiveSession(userId, WIDGET, toTitle(message));
  return session.id;
}

export async function startChatbotSession(userId: string, message: string): Promise<string> {
  const session = await resolveActiveSession(userId, CHATBOT, toTitle(message));
  return session.id;
}

export async function findChatbotSessionId(userId: string): Promise<string | null> {
  const session = await findActiveSession(userId, CHATBOT);
  return session?.id ?? null;
}

export async function ownsSession(sessionId: string, userId: string): Promise<boolean> {
  return (await findSessionOwner(sessionId)) === userId;
}

export async function recordUserMessage(sessionId: string, content: string): Promise<void> {
  await insertMessage({ sessionId, role: "user", content });
}

export async function appendAssistantMessage(
  sessionId: string,
  content: string,
  actions: ChatAction[],
  actingUserId: string,
): Promise<boolean> {
  const owner = await findSessionOwner(sessionId);
  if (owner !== actingUserId) return false;

  await insertMessage({ sessionId, role: "assistant", content, actions });
  return true;
}

export async function getWidgetThread(userId: string): Promise<ChatThreadMessage[]> {
  const session = await findActiveSession(userId, WIDGET);
  if (!session) return [];

  return readThread(session.id);
}

export async function getChatbotThread(sessionId: string): Promise<ChatThreadMessage[]> {
  return readThread(sessionId);
}

export async function listChatbotSessions(userId: string): Promise<ChatSessionSummary[]> {
  const sessions = await listSessions(userId, CHATBOT);
  return sessions.map((session) => ({
    id: session.id,
    title: session.title,
    lastMessageAt: session.lastMessageAt,
    endedAt: session.endedAt,
  }));
}

export async function endWidgetSession(userId: string): Promise<void> {
  await endActiveSession(userId, WIDGET);
}

export async function endChatbotSession(userId: string): Promise<void> {
  await endActiveSession(userId, CHATBOT);
}
