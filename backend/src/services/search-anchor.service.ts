import { findHotelLocationByName } from "../queries/hotels.queries";
import { geocodingProvider } from "./geocoding";

export interface SearchAnchor {
  label: string;
  latitude: number;
  longitude: number;
}

const GEOCODE_CACHE_LIMIT = 200;
const geocoded = new Map<string, SearchAnchor | null>();

function remember(key: string, anchor: SearchAnchor | null): SearchAnchor | null {
  if (geocoded.size >= GEOCODE_CACHE_LIMIT) geocoded.clear();
  geocoded.set(key, anchor);
  return anchor;
}

export async function resolveSearchAnchor(near: string): Promise<SearchAnchor | null> {
  const phrase = near.trim();
  if (!phrase) return null;

  const hotel = await findHotelLocationByName(phrase);
  if (hotel) return { label: hotel.name, latitude: hotel.latitude, longitude: hotel.longitude };

  const key = phrase.toLowerCase();
  const cached = geocoded.get(key);
  if (cached !== undefined) return cached;

  try {
    const place = await geocodingProvider.geocodePlace(phrase);
    if (!place) return remember(key, null);
    return remember(key, { label: phrase, latitude: place.latitude, longitude: place.longitude });
  } catch (error) {
    console.error("[services/search-anchor] could not resolve", phrase, error instanceof Error ? error.message : error);
    return remember(key, null);
  }
}
