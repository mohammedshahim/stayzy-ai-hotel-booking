import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginMutation } from "@/features/auth/authApi";

export function LoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const result = await login({ email, password });
    if ("error" in result) {
      const message =
        typeof result.error === "object" &&
        result.error !== null &&
        "data" in result.error &&
        typeof result.error.data === "object" &&
        result.error.data !== null &&
        "message" in result.error.data
          ? String(result.error.data.message)
          : "Could not log in";
      setError(message);
      return;
    }
    navigate(searchParams.get("returnTo") ?? "/", { replace: true });
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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className="h-10 rounded-xl border-border-default bg-subtle px-3 text-text-primary placeholder:text-text-muted focus-visible:border-accent-border focus-visible:ring-accent-border"
        />
      </div>
      {error && <p className="text-xs text-state-error">{error}</p>}
      <Button
        type="submit"
        disabled={isLoading}
        className="h-9 rounded-xl bg-accent-primary px-4 font-medium text-white hover:bg-accent-hover disabled:opacity-70"
      >
        {isLoading ? "Logging in..." : "Log in"}
      </Button>
    </form>
  );
}
