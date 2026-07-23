import { env } from "../../config/env";
import type { GeocodedLocation, GeocodingProvider } from "./geocoding.provider";

const MAPBOX_GEOCODING_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";

const PLACE_TYPES_EXCLUDING_STREETS = "poi,place,locality,neighborhood,district,region";
const MIN_PLACE_RELEVANCE = 0.8;

interface MapboxFeature {
  center?: [number, number];
  relevance?: number;
}

async function requestFeatures(query: string, params: string): Promise<MapboxFeature[]> {
  if (!env.MAPBOX_ACCESS_TOKEN) {
    throw new Error("Geocoding is not configured: MAPBOX_ACCESS_TOKEN is missing");
  }

  const url = `${MAPBOX_GEOCODING_URL}/${encodeURIComponent(query)}.json?access_token=${env.MAPBOX_ACCESS_TOKEN}&${params}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding request failed with status ${response.status}`);
  }

  const body = (await response.json()) as { features?: MapboxFeature[] };
  return body.features ?? [];
}

export const mapboxGeocodingProvider: GeocodingProvider = {
  async geocode(address: string): Promise<GeocodedLocation> {
    const [feature] = await requestFeatures(address, "limit=1");
    const center = feature?.center;
    if (!center) {
      throw new Error(`Could not geocode address: ${address}`);
    }

    const [longitude, latitude] = center;
    return { latitude, longitude };
  },

  async geocodePlace(query: string): Promise<GeocodedLocation | null> {
    const [feature] = await requestFeatures(query, `limit=1&types=${PLACE_TYPES_EXCLUDING_STREETS}`);
    if (!feature?.center || (feature.relevance ?? 0) < MIN_PLACE_RELEVANCE) {
      return null;
    }

    const [longitude, latitude] = feature.center;
    return { latitude, longitude };
  },
};
