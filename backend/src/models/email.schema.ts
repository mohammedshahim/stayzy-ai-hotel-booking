import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const emailSendThrottles = pgTable(
  "email_send_throttles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipient: text("recipient").notNull(),
    purpose: text("purpose").notNull(),
    lastSentAt: timestamp("last_sent_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => [unique("email_send_throttles_recipient_purpose_key").on(table.recipient, table.purpose)],
);

export type EmailSendThrottle = typeof emailSendThrottles.$inferSelect;

export type EmailPurpose = "email_verification" | "password_reset";
