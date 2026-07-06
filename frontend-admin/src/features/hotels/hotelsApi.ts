import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/apiBaseQuery";
import type { Hotel, HotelFormInput, HotelImage, ListHotelsResponse } from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const hotelsApi = createApi({
  reducerPath: "hotelsApi",
  baseQuery,
  tagTypes: ["Hotel"],
  endpoints: (builder) => ({
    getHotels: builder.query<ListHotelsResponse, { page: number; pageSize: number }>({
      query: ({ page, pageSize }) => `/admin/hotels?page=${page}&pageSize=${pageSize}`,
      transformResponse: (response: ApiEnvelope<ListHotelsResponse>) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((hotel) => ({ type: "Hotel" as const, id: hotel.id })),
              { type: "Hotel" as const, id: "LIST" },
            ]
          : [{ type: "Hotel" as const, id: "LIST" }],
    }),
    getHotel: builder.query<Hotel, string>({
      query: (id) => `/admin/hotels/${id}`,
      transformResponse: (response: ApiEnvelope<Hotel>) => response.data,
      providesTags: (_result, _error, id) => [{ type: "Hotel", id }],
    }),
    createHotel: builder.mutation<Hotel, HotelFormInput>({
      query: (body) => ({ url: "/admin/hotels", method: "POST", body }),
      transformResponse: (response: ApiEnvelope<Hotel>) => response.data,
      invalidatesTags: [{ type: "Hotel", id: "LIST" }],
    }),
    updateHotel: builder.mutation<Hotel, { id: string; body: HotelFormInput }>({
      query: ({ id, body }) => ({ url: `/admin/hotels/${id}`, method: "PATCH", body }),
      transformResponse: (response: ApiEnvelope<Hotel>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Hotel", id },
        { type: "Hotel", id: "LIST" },
      ],
    }),
    deleteHotel: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/hotels/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Hotel", id: "LIST" }],
    }),
    uploadHotelImage: builder.mutation<HotelImage, { hotelId: string; file: File }>({
      query: ({ hotelId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return { url: `/admin/hotels/${hotelId}/images`, method: "POST", body: formData };
      },
      transformResponse: (response: ApiEnvelope<HotelImage>) => response.data,
      invalidatesTags: (_result, _error, { hotelId }) => [{ type: "Hotel", id: hotelId }],
    }),
    reorderHotelImages: builder.mutation<
      HotelImage[],
      { hotelId: string; imageIds: string[]; mainImageId: string }
    >({
      query: ({ hotelId, imageIds, mainImageId }) => ({
        url: `/admin/hotels/${hotelId}/images`,
        method: "PATCH",
        body: { imageIds, mainImageId },
      }),
      transformResponse: (response: ApiEnvelope<HotelImage[]>) => response.data,
      invalidatesTags: (_result, _error, { hotelId }) => [{ type: "Hotel", id: hotelId }],
    }),
    deleteHotelImage: builder.mutation<void, { hotelId: string; imageId: string }>({
      query: ({ hotelId, imageId }) => ({ url: `/admin/hotels/${hotelId}/images/${imageId}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, { hotelId }) => [{ type: "Hotel", id: hotelId }],
    }),
  }),
});

export const {
  useGetHotelsQuery,
  useGetHotelQuery,
  useCreateHotelMutation,
  useUpdateHotelMutation,
  useDeleteHotelMutation,
  useUploadHotelImageMutation,
  useReorderHotelImagesMutation,
  useDeleteHotelImageMutation,
} = hotelsApi;
