import { createBrowserRouter } from "react-router-dom";

function Placeholder({ label }: { label: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base">
      <p className="text-sm text-text-muted">{label}</p>
    </main>
  );
}

export const router = createBrowserRouter([
  { path: "/login", element: <Placeholder label="Admin login arrives in Feature 04." /> },
  { path: "/", element: <Placeholder label="Admin dashboard arrives in Feature 27." /> },
]);
