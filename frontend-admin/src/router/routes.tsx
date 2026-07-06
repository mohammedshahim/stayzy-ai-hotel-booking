import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "@/features/auth/components/LoginPage";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { HotelsListPage } from "@/features/hotels/components/HotelsListPage";
import { HotelFormPage } from "@/features/hotels/components/HotelFormPage";

function Placeholder({ label }: { label: string }) {
  return <p className="text-sm text-text-muted">{label}</p>;
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/", element: <Placeholder label="Admin dashboard arrives in Feature 27." /> },
      { path: "/hotels", element: <HotelsListPage /> },
      { path: "/hotels/new", element: <HotelFormPage /> },
      { path: "/hotels/:id", element: <HotelFormPage /> },
    ],
  },
]);
