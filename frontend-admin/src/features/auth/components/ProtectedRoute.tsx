import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useGetSessionQuery } from "@/features/auth/authApi";

export function ProtectedRoute() {
  const { data, isLoading } = useGetSessionQuery();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base">
        <p className="text-sm text-text-muted">Loading...</p>
      </main>
    );
  }

  if (!data) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
