import { and, asc, count, eq, sql } from "drizzle-orm";
import { db } from "../config/db";
import { roomTypeImages } from "../models/room-type.schema";
import type { RoomTypeImage } from "../models/room-type.schema";

const IMAGE_COLUMNS = {
  id: roomTypeImages.id,
  roomTypeId: roomTypeImages.roomTypeId,
  url: roomTypeImages.url,
  isMain: roomTypeImages.isMain,
  sortOrder: roomTypeImages.sortOrder,
  createdAt: roomTypeImages.createdAt,
};

export async function listRoomTypeImages(roomTypeId: string): Promise<RoomTypeImage[]> {
  return db
    .select(IMAGE_COLUMNS)
    .from(roomTypeImages)
    .where(eq(roomTypeImages.roomTypeId, roomTypeId))
    .orderBy(asc(roomTypeImages.sortOrder));
}

export async function getRoomTypeImageById(imageId: string): Promise<RoomTypeImage | null> {
  const [row] = await db.select(IMAGE_COLUMNS).from(roomTypeImages).where(eq(roomTypeImages.id, imageId));
  return row ?? null;
}

export async function countRoomTypeImages(roomTypeId: string): Promise<number> {
  const [row] = await db.select({ count: count() }).from(roomTypeImages).where(eq(roomTypeImages.roomTypeId, roomTypeId));
  return row?.count ?? 0;
}

export async function insertRoomTypeImage(roomTypeId: string, url: string, isMain: boolean): Promise<RoomTypeImage> {
  const [row] = await db
    .insert(roomTypeImages)
    .values({
      roomTypeId,
      url,
      isMain,
      sortOrder: sql`(SELECT COALESCE(MAX(${roomTypeImages.sortOrder}), -1) + 1 FROM ${roomTypeImages} WHERE ${roomTypeImages.roomTypeId} = ${roomTypeId})`,
    })
    .returning(IMAGE_COLUMNS);
  if (!row) throw new Error("Failed to insert room type image");
  return row;
}

export async function deleteRoomTypeImage(imageId: string): Promise<void> {
  await db.delete(roomTypeImages).where(eq(roomTypeImages.id, imageId));
}

export async function reorderRoomTypeImages(
  roomTypeId: string,
  imageIds: string[],
  mainImageId: string,
): Promise<RoomTypeImage[]> {
  await db.transaction(async (tx) => {
    await tx.update(roomTypeImages).set({ isMain: false }).where(eq(roomTypeImages.roomTypeId, roomTypeId));
    for (const [index, imageId] of imageIds.entries()) {
      await tx
        .update(roomTypeImages)
        .set({ sortOrder: index, isMain: imageId === mainImageId })
        .where(and(eq(roomTypeImages.id, imageId), eq(roomTypeImages.roomTypeId, roomTypeId)));
    }
  });
  return listRoomTypeImages(roomTypeId);
}
