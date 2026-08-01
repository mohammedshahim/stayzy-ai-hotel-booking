"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SetPasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setIsSaved(false);

    const response = await apiClient.post<null>("/users/set-password", { newPassword });

    setIsSubmitting(false);
    if (!response.success) {
      setError(response.error);
      return;
    }
    setNewPassword("");
    setIsSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-text-secondary">
        Your account currently signs in with Google only. Set a password to also sign in with your email.
      </p>
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
      {isSaved && <p className="text-xs text-success">Password set. You can now sign in with your email too.</p>}
      {error && <p className="text-xs text-error">{error}</p>}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-9 w-fit rounded-xl bg-accent-primary px-4 font-medium text-white hover:bg-accent-hover disabled:opacity-70"
      >
        {isSubmitting ? "Saving..." : "Set password"}
      </Button>
    </form>
  );
}
