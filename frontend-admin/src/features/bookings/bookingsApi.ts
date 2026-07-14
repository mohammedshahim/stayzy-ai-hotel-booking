import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/apiBaseQuery";
import type { AdminBookingDetail, ListBookingsParams, ListBookingsResponse, ReallocateBookingInput } from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

function buildQuery(params: ListBookingsParams): string {
  const search = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
  if (params.status) search.set("status", params.status);
  if (params.hotelId) search.set("hotelId", params.hotelId);
  if (params.checkInFrom) search.set("checkInFrom", params.checkInFrom);
  if (params.checkInTo) search.set("checkInTo", params.checkInTo);
  return search.toString();
}

export const bookingsApi = createApi({
  reducerPath: "bookingsApi",
  baseQuery,
  tagTypes: ["Booking"],
  endpoints: (builder) => ({
    getBookings: builder.query<ListBookingsResponse, ListBookingsParams>({
      query: (params) => `/admin/bookings?${buildQuery(params)}`,
      transformResponse: (response: ApiEnvelope<ListBookingsResponse>) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((booking) => ({ type: "Booking" as const, id: booking.id })),
              { type: "Booking" as const, id: "LIST" },
            ]
          : [{ type: "Booking" as const, id: "LIST" }],
    }),
    getBooking: builder.query<AdminBookingDetail, string>({
      query: (id) => `/admin/bookings/${id}`,
      transformResponse: (response: ApiEnvelope<AdminBookingDetail>) => response.data,
      providesTags: (_result, _error, id) => [{ type: "Booking", id }],
    }),
    confirmBooking: builder.mutation<AdminBookingDetail, string>({
      query: (id) => ({ url: `/admin/bookings/${id}/confirm`, method: "POST" }),
      transformResponse: (response: ApiEnvelope<AdminBookingDetail>) => response.data,
      invalidatesTags: (_result, _error, id) => [
        { type: "Booking", id },
        { type: "Booking", id: "LIST" },
      ],
    }),
    cancelBooking: builder.mutation<AdminBookingDetail, string>({
      query: (id) => ({ url: `/admin/bookings/${id}/cancel`, method: "POST" }),
      transformResponse: (response: ApiEnvelope<AdminBookingDetail>) => response.data,
      invalidatesTags: (_result, _error, id) => [
        { type: "Booking", id },
        { type: "Booking", id: "LIST" },
      ],
    }),
    reallocateBooking: builder.mutation<AdminBookingDetail, { id: string; body: ReallocateBookingInput }>({
      query: ({ id, body }) => ({ url: `/admin/bookings/${id}/reallocate`, method: "POST", body }),
      transformResponse: (response: ApiEnvelope<AdminBookingDetail>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Booking", id },
        { type: "Booking", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetBookingsQuery,
  useGetBookingQuery,
  useConfirmBookingMutation,
  useCancelBookingMutation,
  useReallocateBookingMutation,
} = bookingsApi;
