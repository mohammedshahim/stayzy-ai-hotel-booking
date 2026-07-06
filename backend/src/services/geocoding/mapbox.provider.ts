import { env } from "../../config/env";
import type { GeocodedLocation, GeocodingProvider } from "./geocoding.provider";

const MAPBOX_GEOCODING_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";

export const mapboxGeocodingProvider: GeocodingProvider = {
  async geocode(address: string): Promise<GeocodedLocation> {
    if (!env.MAPBOX_ACCESS_TOKEN) {
      throw new Error("Geocoding is not configured: MAPBOX_ACCESS_TOKEN is missing");
    }

    const url = `${MAPBOX_GEOCODING_URL}/${encodeURIComponent(address)}.json?access_token=${env.MAPBOX_ACCESS_TOKEN}&limit=1`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Geocoding request failed with status ${response.status}`);
    }

    const body = (await response.json()) as { features?: { center?: [number, number] }[] };
    const center = body.features?.[0]?.center;
    if (!center) {
      throw new Error(`Could not geocode address: ${address}`);
    }

    const [longitude, latitude] = center;
    return { latitude, longitude };
  },
};
