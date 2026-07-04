"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const isVerified = searchParams.get("verified") === "true";
  const { data: session } = authClient.useSession();
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isVerified) {
    return <p className="text-sm text-text-secondary">Your email is verified. You&apos;re all set to book a stay.</p>;
  }

  async function handleResend() {
    if (!session?.user.email) return;
    setError(null);
    setIsSubmitting(true);

    const { error: resendError } = await authClient.sendVerificationEmail({
      email: session.user.email,
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
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-secondary">
        We sent a verification link to{" "}
        <span className="font-medium text-text-primary">{session?.user.email ?? "your email"}</span>. Click it to
        verify your account — you can keep browsing in the meantime.
      </p>
      {isSent && <p className="text-xs text-state-success">Verification email resent.</p>}
      {error && <p className="text-xs text-state-error">{error}</p>}
      <Button
        type="button"
        variant="outline"
        onClick={handleResend}
        disabled={isSubmitting}
        className="h-9 w-full rounded-xl border border-border-default bg-elevated px-4 text-text-secondary hover:border-border-subtle hover:bg-subtle hover:text-text-primary disabled:opacity-70"
      >
        {isSubmitting ? "Resending..." : "Resend verification email"}
      </Button>
    </div>
  );
}
