import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/apiBaseQuery";
import type { ListBookingsParams, ListBookingsResponse } from "./types";

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
  }),
});

export const { useGetBookingsQuery } = bookingsApi;
