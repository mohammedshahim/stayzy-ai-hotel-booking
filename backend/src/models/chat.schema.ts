import { sql } from "drizzle-orm";
import { check, index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.schema";

export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    feature: text("feature").notNull(),
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    check("chat_sessions_feature_check", sql`${table.feature} IN ('widget', 'chatbot')`),
    uniqueIndex("chat_sessions_active_idx")
      .on(table.userId, table.feature)
      .where(sql`${table.endedAt} IS NULL`),
    index("chat_sessions_user_feature_idx").on(table.userId, table.feature, table.lastMessageAt),
  ],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    actionsJson: jsonb("actions_json"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    check("chat_messages_role_check", sql`${table.role} IN ('user', 'assistant')`),
    index("chat_messages_session_idx").on(table.sessionId, table.createdAt),
  ],
);

export type ChatSession = typeof chatSessions.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
