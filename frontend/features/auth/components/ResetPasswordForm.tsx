"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setError("This reset link is invalid or has expired.");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const { error: resetError } = await authClient.resetPassword({ newPassword, token });

    setIsSubmitting(false);
    if (resetError) {
      setError(resetError.message ?? "Could not reset your password");
      return;
    }
    router.push("/login");
  }

  if (!token) {
    return (
      <p className="text-sm text-text-secondary">
        This reset link is invalid or has expired.{" "}
        <Link href="/forgot-password" className="text-accent-text hover:underline">
          Request a new one
        </Link>
        .
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
          minLength={8}
          className="h-10 rounded-xl border-border-default bg-subtle px-3 text-text-primary placeholder:text-text-muted focus-visible:border-accent-border focus-visible:ring-accent-border"
        />
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-9 rounded-xl bg-accent-primary px-4 font-medium text-white hover:bg-accent-hover disabled:opacity-70"
      >
        {isSubmitting ? "Saving..." : "Set new password"}
      </Button>
    </form>
  );
}
