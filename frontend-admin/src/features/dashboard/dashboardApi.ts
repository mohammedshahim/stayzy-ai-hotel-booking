import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/apiBaseQuery";
import type { AdminDashboardData, GetDashboardParams } from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery,
  tagTypes: ["Dashboard"],
  endpoints: (builder) => ({
    getDashboard: builder.query<AdminDashboardData, GetDashboardParams>({
      query: (params) => `/admin/dashboard?checkInFrom=${params.checkInFrom}&checkInTo=${params.checkInTo}`,
      transformResponse: (response: ApiEnvelope<AdminDashboardData>) => response.data,
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetDashboardQuery } = dashboardApi;
