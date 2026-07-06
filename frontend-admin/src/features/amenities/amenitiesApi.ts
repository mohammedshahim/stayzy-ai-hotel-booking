import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/apiBaseQuery";
import type { Amenity } from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const amenitiesApi = createApi({
  reducerPath: "amenitiesApi",
  baseQuery,
  endpoints: (builder) => ({
    getAmenities: builder.query<Amenity[], void>({
      query: () => "/admin/amenities",
      transformResponse: (response: ApiEnvelope<Amenity[]>) => response.data,
    }),
  }),
});

export const { useGetAmenitiesQuery } = amenitiesApi;
