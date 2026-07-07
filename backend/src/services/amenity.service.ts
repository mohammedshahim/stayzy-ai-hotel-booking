import { listAmenities } from "../queries/amenities.queries";
import type { Amenity } from "../models/hotel.schema";

export async function listAmenitiesForPicker(): Promise<Amenity[]> {
  return listAmenities();
}
