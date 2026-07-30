import { Resend } from "resend";
import { env } from "../config/env";
import type { EmailPurpose } from "../models/email.schema";
import { findLastEmailSentAt, recordEmailSent } from "../queries/email-throttle.queries";

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html });
  if (error) {
    console.error("[services/email] send failed", error);
    throw new Error("Could not send email");
  }
}

async function sendThrottledEmail(
  to: string,
  purpose: EmailPurpose,
  subject: string,
  html: string,
): Promise<boolean> {
  const recipient = to.toLowerCase();
  const lastSentAt = await findLastEmailSentAt(recipient, purpose);

  if (lastSentAt !== null) {
    const elapsedMs = Date.now() - Date.parse(lastSentAt);
    if (elapsedMs < env.EMAIL_THROTTLE_WINDOW_MINUTES * 60_000) {
      console.warn(`[services/email] suppressed ${purpose} for ${recipient} — still inside the throttle window`);
      return false;
    }
  }

  await sendEmail(to, subject, html);
  await recordEmailSent(recipient, purpose);
  return true;
}

export async function sendVerificationEmail(to: string, url: string): Promise<boolean> {
  return sendThrottledEmail(
    to,
    "email_verification",
    "Verify your Stayzy email",
    `<p>Confirm your email to finish setting up your Stayzy account.</p><p><a href="${url}">Verify email</a></p>`,
  );
}

export async function sendPasswordResetEmail(to: string, url: string): Promise<boolean> {
  return sendThrottledEmail(
    to,
    "password_reset",
    "Reset your Stayzy password",
    `<p>Click the link below to set a new password.</p><p><a href="${url}">Reset password</a></p>`,
  );
}
