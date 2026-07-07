import { asc } from "drizzle-orm";
import { db } from "../config/db";
import { roomFeatures } from "../models/room-type.schema";
import type { RoomFeature } from "../models/room-type.schema";

export async function listRoomFeatures(): Promise<RoomFeature[]> {
  return db.select({ id: roomFeatures.id, name: roomFeatures.name }).from(roomFeatures).orderBy(asc(roomFeatures.name));
}
