import { asc } from "drizzle-orm";
import { db } from "../config/db";
import { amenities } from "../models/hotel.schema";
import type { Amenity } from "../models/hotel.schema";

export async function listAmenities(): Promise<Amenity[]> {
  return db
    .select({ id: amenities.id, name: amenities.name, icon: amenities.icon })
    .from(amenities)
    .orderBy(asc(amenities.name));
}
