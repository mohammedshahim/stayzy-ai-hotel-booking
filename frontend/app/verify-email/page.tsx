import { Suspense } from "react";
import { AuthCard } from "@/features/auth/components/AuthCard";
import { VerifyEmailStatus } from "@/features/auth/components/VerifyEmailStatus";

export default function VerifyEmailPage() {
  return (
    <AuthCard title="Verify your email">
      <Suspense>
        <VerifyEmailStatus />
      </Suspense>
    </AuthCard>
  );
}
