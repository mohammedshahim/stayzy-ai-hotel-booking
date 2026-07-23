export interface GeocodedLocation {
  latitude: number;
  longitude: number;
}

export interface GeocodingProvider {
  geocode(address: string): Promise<GeocodedLocation>;
  // null when nothing matched confidently enough to anchor a search on.
  geocodePlace(query: string): Promise<GeocodedLocation | null>;
}
