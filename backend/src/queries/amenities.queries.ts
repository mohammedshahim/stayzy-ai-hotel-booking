import { db } from "../config/db";
import type { Amenity } from "../models/hotel.model";

export async function listAmenities(): Promise<Amenity[]> {
  const { rows } = await db.query<Amenity>(`SELECT id, name, icon FROM amenities ORDER BY name`);
  return rows;
}
