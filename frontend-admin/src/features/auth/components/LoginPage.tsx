import { AuthCard } from "./AuthCard";
import { LoginForm } from "./LoginForm";

export function LoginPage() {
  return (
    <AuthCard title="Admin Login" description="Sign in to manage Stayzy.">
      <LoginForm />
    </AuthCard>
  );
}
