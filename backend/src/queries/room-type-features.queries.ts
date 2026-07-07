import { asc, eq } from "drizzle-orm";
import { db } from "../config/db";
import { roomFeatures, roomTypeFeatures } from "../models/room-type.schema";
import type { RoomFeature } from "../models/room-type.schema";

export async function getRoomTypeFeatures(roomTypeId: string): Promise<RoomFeature[]> {
  return db
    .select({ id: roomFeatures.id, name: roomFeatures.name })
    .from(roomFeatures)
    .innerJoin(roomTypeFeatures, eq(roomTypeFeatures.roomFeatureId, roomFeatures.id))
    .where(eq(roomTypeFeatures.roomTypeId, roomTypeId))
    .orderBy(asc(roomFeatures.name));
}

export async function setRoomTypeFeatures(roomTypeId: string, roomFeatureIds: string[]): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(roomTypeFeatures).where(eq(roomTypeFeatures.roomTypeId, roomTypeId));
    if (roomFeatureIds.length > 0) {
      await tx.insert(roomTypeFeatures).values(roomFeatureIds.map((roomFeatureId) => ({ roomTypeId, roomFeatureId })));
    }
  });
}
