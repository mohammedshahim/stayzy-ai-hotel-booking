import { and, eq } from "drizzle-orm";
import { db } from "../config/db";
import { emailSendThrottles, type EmailPurpose } from "../models/email.schema";

export async function findLastEmailSentAt(recipient: string, purpose: EmailPurpose): Promise<string | null> {
  const [row] = await db
    .select({ lastSentAt: emailSendThrottles.lastSentAt })
    .from(emailSendThrottles)
    .where(and(eq(emailSendThrottles.recipient, recipient), eq(emailSendThrottles.purpose, purpose)))
    .limit(1);
  return row?.lastSentAt ?? null;
}

export async function recordEmailSent(recipient: string, purpose: EmailPurpose): Promise<void> {
  await db
    .insert(emailSendThrottles)
    .values({ recipient, purpose })
    .onConflictDoUpdate({
      target: [emailSendThrottles.recipient, emailSendThrottles.purpose],
      set: { lastSentAt: new Date().toISOString() },
    });
}
