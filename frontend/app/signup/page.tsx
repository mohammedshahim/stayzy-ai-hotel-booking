import { AuthCard } from "@/features/auth/components/AuthCard";
import { SignupForm } from "@/features/auth/components/SignupForm";

export default function SignupPage() {
  return (
    <AuthCard title="Create your account" description="Sign up to search, save, and book hotels.">
      <SignupForm />
    </AuthCard>
  );
}
