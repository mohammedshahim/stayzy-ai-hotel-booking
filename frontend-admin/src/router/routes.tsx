import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "@/features/auth/components/LoginPage";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";

function Placeholder({ label }: { label: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base">
      <p className="text-sm text-text-muted">{label}</p>
    </main>
  );
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [{ path: "/", element: <Placeholder label="Admin dashboard arrives in Feature 27." /> }],
  },
]);
