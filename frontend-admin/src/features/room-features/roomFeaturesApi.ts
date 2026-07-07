import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/apiBaseQuery";
import type { RoomFeature } from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const roomFeaturesApi = createApi({
  reducerPath: "roomFeaturesApi",
  baseQuery,
  endpoints: (builder) => ({
    getRoomFeatures: builder.query<RoomFeature[], void>({
      query: () => "/admin/room-features",
      transformResponse: (response: ApiEnvelope<RoomFeature[]>) => response.data,
    }),
  }),
});

export const { useGetRoomFeaturesQuery } = roomFeaturesApi;
