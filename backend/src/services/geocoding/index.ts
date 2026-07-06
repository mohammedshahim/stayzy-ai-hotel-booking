import { env } from "../../config/env";
import { mapboxGeocodingProvider } from "./mapbox.provider";
import type { GeocodingProvider } from "./geocoding.provider";

const PROVIDERS: Record<string, GeocodingProvider> = {
  mapbox: mapboxGeocodingProvider,
};

export const geocodingProvider: GeocodingProvider = PROVIDERS[env.GEOCODING_PROVIDER] ?? mapboxGeocodingProvider;

export type { GeocodedLocation, GeocodingProvider } from "./geocoding.provider";
