export interface GeocodedLocation {
  latitude: number;
  longitude: number;
}

export interface GeocodingProvider {
  geocode(address: string): Promise<GeocodedLocation>;
}
