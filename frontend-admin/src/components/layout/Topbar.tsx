import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useGetSessionQuery, useLogoutMutation } from "@/features/auth/authApi";

export function Topbar() {
  const { data } = useGetSessionQuery();
  const [logout, { isLoading }] = useLogoutMutation();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border-default bg-surface px-4 lg:px-6">
      <span className="text-sm text-text-muted">{data?.user.email}</span>
      <Button
        variant="ghost"
        onClick={handleLogout}
        disabled={isLoading}
        className="h-9 gap-2 rounded-xl px-3 text-sm text-text-secondary hover:bg-subtle"
      >
        <LogOut className="size-4" />
        Log out
      </Button>
    </header>
  );
}
