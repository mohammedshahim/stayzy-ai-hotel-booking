import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/apiBaseQuery";
import type { MealPlan } from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const mealPlansApi = createApi({
  reducerPath: "mealPlansApi",
  baseQuery,
  endpoints: (builder) => ({
    getMealPlans: builder.query<MealPlan[], void>({
      query: () => "/admin/meal-plans",
      transformResponse: (response: ApiEnvelope<MealPlan[]>) => response.data,
    }),
  }),
});

export const { useGetMealPlansQuery } = mealPlansApi;
