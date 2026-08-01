"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { ChangePasswordForm } from "@/features/profile/components/ChangePasswordForm";
import { SetPasswordForm } from "@/features/profile/components/SetPasswordForm";

export function PasswordPanel() {
  const [hasCredentialAccount, setHasCredentialAccount] = useState<boolean | null>(null);

  useEffect(() => {
    authClient.listAccounts().then(({ data }) => {
      setHasCredentialAccount(data?.some((account) => account.providerId === "credential") ?? false);
    });
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-border-default bg-surface">
      <div className="border-b border-border-default px-5 py-4">
        <h2 className="text-lg font-semibold text-text-primary">Password</h2>
      </div>
      <div className="p-5">
        {hasCredentialAccount === null ? null : hasCredentialAccount ? <ChangePasswordForm /> : <SetPasswordForm />}
      </div>
    </div>
  );
}
