"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function GoogleSignInButton() {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/" })}
      className="h-9 w-full rounded-xl border border-border-default bg-elevated px-4 text-text-secondary transition-colors hover:border-border-subtle hover:bg-subtle hover:text-text-primary"
    >
      Continue with Google
    </Button>
  );
}
