"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setIsSaved(false);

    const { error: changeError } = await authClient.changePassword({ currentPassword, newPassword });

    setIsSubmitting(false);
    if (changeError) {
      setError(changeError.message ?? "Could not change your password");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setIsSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
          className="h-10 rounded-xl border-border-default bg-subtle px-3 text-text-primary placeholder:text-text-muted focus-visible:border-accent-border focus-visible:ring-accent-border"
        />
      </div>
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
      {isSaved && <p className="text-xs text-success">Password updated.</p>}
      {error && <p className="text-xs text-error">{error}</p>}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-9 w-fit rounded-xl bg-accent-primary px-4 font-medium text-white hover:bg-accent-hover disabled:opacity-70"
      >
        {isSubmitting ? "Saving..." : "Change password"}
      </Button>
    </form>
  );
}
