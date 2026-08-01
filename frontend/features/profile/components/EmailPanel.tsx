"use client";

import { useState } from "react";
import { CheckCircle2Icon } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Props = {
  email: string;
  emailVerified: boolean;
};

export function EmailPanel({ email, emailVerified }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    setError(null);
    setIsSubmitting(true);

    const { error: resendError } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/verify-email?verified=true",
    });

    setIsSubmitting(false);
    if (resendError) {
      setError(resendError.message ?? "Could not resend the email");
      return;
    }
    setIsSent(true);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border-default bg-surface">
      <div className="border-b border-border-default px-5 py-4">
        <h2 className="text-lg font-semibold text-text-primary">Email</h2>
      </div>
      <div className="flex flex-col gap-3 p-5">
        <div className="flex flex-col gap-1.5">
          <Label>Email address</Label>
          <p className="text-sm text-text-primary">{email}</p>
        </div>

        {emailVerified ? (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-success/20 bg-success-dim px-2.5 py-1 text-xs font-medium text-success">
            <CheckCircle2Icon className="h-3.5 w-3.5" />
            Verified
          </span>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-warning/20 bg-warning-dim px-2.5 py-1 text-xs font-medium text-warning">
              Not verified
            </span>
            {isSent ? (
              <p className="text-xs text-text-muted">Check your inbox for the verification link.</p>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handleResend}
                disabled={isSubmitting}
                className="h-9 w-fit rounded-xl border border-border-default bg-elevated px-4 text-text-secondary hover:border-border-subtle hover:bg-subtle hover:text-text-primary disabled:opacity-70"
              >
                {isSubmitting ? "Sending..." : "Resend verification email"}
              </Button>
            )}
            {error && <p className="text-xs text-error">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
