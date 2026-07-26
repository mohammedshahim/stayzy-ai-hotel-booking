import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "../config/db";
import { chatMessages, chatSessions, type ChatMessage, type ChatSession } from "../models/chat.schema";
import type { ChatAction } from "../types/chat.schemas";

export type ChatFeature = "widget" | "chatbot";

export async function findActiveSession(userId: string, feature: ChatFeature): Promise<ChatSession | null> {
  const [row] = await db
    .select()
    .from(chatSessions)
    .where(
      and(eq(chatSessions.userId, userId), eq(chatSessions.feature, feature), isNull(chatSessions.endedAt)),
    )
    .limit(1);
  return row ?? null;
}

export async function listSessions(userId: string, feature: ChatFeature): Promise<ChatSession[]> {
  return db
    .select()
    .from(chatSessions)
    .where(and(eq(chatSessions.userId, userId), eq(chatSessions.feature, feature)))
    .orderBy(desc(chatSessions.lastMessageAt));
}

export interface InsertSessionParams {
  userId: string;
  feature: ChatFeature;
  title: string;
}

export async function insertSession(params: InsertSessionParams): Promise<ChatSession> {
  const [row] = await db.insert(chatSessions).values(params).returning();
  return row!;
}

export async function endActiveSession(userId: string, feature: ChatFeature): Promise<void> {
  await db
    .update(chatSessions)
    .set({ endedAt: new Date().toISOString() })
    .where(
      and(eq(chatSessions.userId, userId), eq(chatSessions.feature, feature), isNull(chatSessions.endedAt)),
    );
}

export interface InsertMessageParams {
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  actions?: ChatAction[];
}

export async function insertMessage(params: InsertMessageParams): Promise<ChatMessage> {
  const [row] = await db
    .insert(chatMessages)
    .values({
      sessionId: params.sessionId,
      role: params.role,
      content: params.content,
      actionsJson: params.actions ?? null,
    })
    .returning();

  await db
    .update(chatSessions)
    .set({ lastMessageAt: new Date().toISOString() })
    .where(eq(chatSessions.id, params.sessionId));

  return row!;
}

export async function findSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(asc(chatMessages.createdAt));
}

export async function findSessionOwner(sessionId: string): Promise<string | null> {
  const [row] = await db
    .select({ userId: chatSessions.userId })
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId))
    .limit(1);
  return row?.userId ?? null;
}
