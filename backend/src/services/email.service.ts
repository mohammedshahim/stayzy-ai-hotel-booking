import { Resend } from "resend";
import { env } from "../config/env";

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html });
  if (error) {
    console.error("[services/email] send failed", error);
    throw new Error("Could not send email");
  }
}

export async function sendVerificationEmail(to: string, url: string): Promise<void> {
  await sendEmail(
    to,
    "Verify your Stayzy email",
    `<p>Confirm your email to finish setting up your Stayzy account.</p><p><a href="${url}">Verify email</a></p>`,
  );
}

export async function sendPasswordResetEmail(to: string, url: string): Promise<void> {
  await sendEmail(
    to,
    "Reset your Stayzy password",
    `<p>Click the link below to set a new password.</p><p><a href="${url}">Reset password</a></p>`,
  );
}
