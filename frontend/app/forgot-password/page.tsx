import { AuthCard } from "@/features/auth/components/AuthCard";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Forgot password" description="Enter your email and we'll send you a reset link.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
