import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/apiBaseQuery";
import type { RateOverrideRange, RateOverrideRangeInput, RoomType, RoomTypeFormInput, RoomTypeImage } from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const roomTypesApi = createApi({
  reducerPath: "roomTypesApi",
  baseQuery,
  tagTypes: ["RoomType", "RateOverride"],
  endpoints: (builder) => ({
    getRoomTypes: builder.query<RoomType[], string>({
      query: (hotelId) => `/admin/hotels/${hotelId}/room-types`,
      transformResponse: (response: ApiEnvelope<RoomType[]>) => response.data,
      providesTags: (_result, _error, hotelId) => [{ type: "RoomType", id: hotelId }],
    }),
    createRoomType: builder.mutation<RoomType, { hotelId: string; body: RoomTypeFormInput }>({
      query: ({ hotelId, body }) => ({ url: `/admin/hotels/${hotelId}/room-types`, method: "POST", body }),
      transformResponse: (response: ApiEnvelope<RoomType>) => response.data,
      invalidatesTags: (_result, _error, { hotelId }) => [{ type: "RoomType", id: hotelId }],
    }),
    updateRoomType: builder.mutation<RoomType, { hotelId: string; id: string; body: RoomTypeFormInput }>({
      query: ({ id, body }) => ({ url: `/admin/room-types/${id}`, method: "PATCH", body }),
      transformResponse: (response: ApiEnvelope<RoomType>) => response.data,
      invalidatesTags: (_result, _error, { hotelId }) => [{ type: "RoomType", id: hotelId }],
    }),
    deleteRoomType: builder.mutation<void, { hotelId: string; id: string }>({
      query: ({ id }) => ({ url: `/admin/room-types/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, { hotelId }) => [{ type: "RoomType", id: hotelId }],
    }),
    uploadRoomTypeImage: builder.mutation<RoomTypeImage, { hotelId: string; id: string; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return { url: `/admin/room-types/${id}/images`, method: "POST", body: formData };
      },
      transformResponse: (response: ApiEnvelope<RoomTypeImage>) => response.data,
      invalidatesTags: (_result, _error, { hotelId }) => [{ type: "RoomType", id: hotelId }],
    }),
    reorderRoomTypeImages: builder.mutation<
      RoomTypeImage[],
      { hotelId: string; id: string; imageIds: string[]; mainImageId: string }
    >({
      query: ({ id, imageIds, mainImageId }) => ({
        url: `/admin/room-types/${id}/images`,
        method: "PATCH",
        body: { imageIds, mainImageId },
      }),
      transformResponse: (response: ApiEnvelope<RoomTypeImage[]>) => response.data,
      invalidatesTags: (_result, _error, { hotelId }) => [{ type: "RoomType", id: hotelId }],
    }),
    deleteRoomTypeImage: builder.mutation<void, { hotelId: string; id: string; imageId: string }>({
      query: ({ id, imageId }) => ({ url: `/admin/room-types/${id}/images/${imageId}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, { hotelId }) => [{ type: "RoomType", id: hotelId }],
    }),
    getRateOverrides: builder.query<RateOverrideRange[], string>({
      query: (roomTypeId) => `/admin/room-types/${roomTypeId}/rate-overrides`,
      transformResponse: (response: ApiEnvelope<RateOverrideRange[]>) => response.data,
      providesTags: (_result, _error, roomTypeId) => [{ type: "RateOverride", id: roomTypeId }],
    }),
    createRateOverrideRange: builder.mutation<RateOverrideRange[], { roomTypeId: string; body: RateOverrideRangeInput }>({
      query: ({ roomTypeId, body }) => ({ url: `/admin/room-types/${roomTypeId}/rate-overrides`, method: "POST", body }),
      transformResponse: (response: ApiEnvelope<RateOverrideRange[]>) => response.data,
      invalidatesTags: (_result, _error, { roomTypeId }) => [{ type: "RateOverride", id: roomTypeId }],
    }),
    deleteRateOverrideRange: builder.mutation<
      RateOverrideRange[],
      { roomTypeId: string; body: { startDate: string; endDate: string } }
    >({
      query: ({ roomTypeId, body }) => ({ url: `/admin/room-types/${roomTypeId}/rate-overrides`, method: "DELETE", body }),
      transformResponse: (response: ApiEnvelope<RateOverrideRange[]>) => response.data,
      invalidatesTags: (_result, _error, { roomTypeId }) => [{ type: "RateOverride", id: roomTypeId }],
    }),
  }),
});

export const {
  useGetRoomTypesQuery,
  useCreateRoomTypeMutation,
  useUpdateRoomTypeMutation,
  useDeleteRoomTypeMutation,
  useUploadRoomTypeImageMutation,
  useReorderRoomTypeImagesMutation,
  useDeleteRoomTypeImageMutation,
  useGetRateOverridesQuery,
  useCreateRateOverrideRangeMutation,
  useDeleteRateOverrideRangeMutation,
} = roomTypesApi;
