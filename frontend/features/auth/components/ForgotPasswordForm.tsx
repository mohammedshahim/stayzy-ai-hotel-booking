"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: requestError } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });

    setIsSubmitting(false);
    if (requestError) {
      setError(requestError.message ?? "Could not send the reset email");
      return;
    }
    setIsSent(true);
  }

  if (isSent) {
    return (
      <p className="text-sm text-text-secondary">
        If an account exists for <span className="font-medium text-text-primary">{email}</span>, a password reset
        link is on its way.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="h-10 rounded-xl border-border-default bg-subtle px-3 text-text-primary placeholder:text-text-muted focus-visible:border-accent-border focus-visible:ring-accent-border"
        />
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-9 rounded-xl bg-accent-primary px-4 font-medium text-white hover:bg-accent-hover disabled:opacity-70"
      >
        {isSubmitting ? "Sending..." : "Send reset link"}
      </Button>
      <p className="text-center text-sm text-text-muted">
        <Link href="/login" className="text-accent-text hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
