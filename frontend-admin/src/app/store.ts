import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "@/features/auth/authApi";
import { hotelsApi } from "@/features/hotels/hotelsApi";
import { amenitiesApi } from "@/features/amenities/amenitiesApi";

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [hotelsApi.reducerPath]: hotelsApi.reducer,
    [amenitiesApi.reducerPath]: amenitiesApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(authApi.middleware, hotelsApi.middleware, amenitiesApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
