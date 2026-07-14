import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "@/features/auth/authApi";
import { hotelsApi } from "@/features/hotels/hotelsApi";
import { amenitiesApi } from "@/features/amenities/amenitiesApi";
import { roomTypesApi } from "@/features/room-types/roomTypesApi";
import { roomFeaturesApi } from "@/features/room-features/roomFeaturesApi";
import { mealPlansApi } from "@/features/meal-plans/mealPlansApi";
import { bookingsApi } from "@/features/bookings/bookingsApi";

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [hotelsApi.reducerPath]: hotelsApi.reducer,
    [amenitiesApi.reducerPath]: amenitiesApi.reducer,
    [roomTypesApi.reducerPath]: roomTypesApi.reducer,
    [roomFeaturesApi.reducerPath]: roomFeaturesApi.reducer,
    [mealPlansApi.reducerPath]: mealPlansApi.reducer,
    [bookingsApi.reducerPath]: bookingsApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault().concat(
      authApi.middleware,
      hotelsApi.middleware,
      amenitiesApi.middleware,
      roomTypesApi.middleware,
      roomFeaturesApi.middleware,
      mealPlansApi.middleware,
      bookingsApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
