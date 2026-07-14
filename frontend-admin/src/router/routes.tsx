import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "@/features/auth/components/LoginPage";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { HotelsListPage } from "@/features/hotels/components/HotelsListPage";
import { HotelFormPage } from "@/features/hotels/components/HotelFormPage";
import { BookingsListPage } from "@/features/bookings/components/BookingsListPage";
import { BookingDetailPage } from "@/features/bookings/components/BookingDetailPage";
import { DashboardPage } from "@/features/dashboard/components/DashboardPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/hotels", element: <HotelsListPage /> },
      { path: "/hotels/new", element: <HotelFormPage /> },
      { path: "/hotels/:id", element: <HotelFormPage /> },
      { path: "/bookings", element: <BookingsListPage /> },
      { path: "/bookings/:id", element: <BookingDetailPage /> },
    ],
  },
]);
