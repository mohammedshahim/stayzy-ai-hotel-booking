import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/apiBaseQuery";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string | null;
  emailVerified: boolean;
}

interface SessionResponse {
  user: AdminUser;
  session: { id: string; expiresAt: string };
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery,
  tagTypes: ["AdminSession"],
  endpoints: (builder) => ({
    getSession: builder.query<SessionResponse | null, void>({
      query: () => "/api/admin/auth/get-session",
      providesTags: ["AdminSession"],
    }),
    login: builder.mutation<{ user: AdminUser }, { email: string; password: string }>({
      query: (body) => ({ url: "/api/admin/auth/sign-in/email", method: "POST", body }),
      invalidatesTags: ["AdminSession"],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: "/api/admin/auth/sign-out", method: "POST" }),
      invalidatesTags: ["AdminSession"],
    }),
  }),
});

export const { useGetSessionQuery, useLoginMutation, useLogoutMutation } = authApi;
