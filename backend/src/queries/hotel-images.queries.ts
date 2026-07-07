import { and, asc, count, eq, sql } from "drizzle-orm";
import { db } from "../config/db";
import { hotelImages } from "../models/hotel.schema";
import type { HotelImage } from "../models/hotel.schema";

const IMAGE_COLUMNS = {
  id: hotelImages.id,
  hotelId: hotelImages.hotelId,
  url: hotelImages.url,
  isMain: hotelImages.isMain,
  sortOrder: hotelImages.sortOrder,
};

export async function listHotelImages(hotelId: string): Promise<HotelImage[]> {
  return db
    .select(IMAGE_COLUMNS)
    .from(hotelImages)
    .where(eq(hotelImages.hotelId, hotelId))
    .orderBy(asc(hotelImages.sortOrder));
}

export async function getHotelImageById(imageId: string): Promise<HotelImage | null> {
  const [row] = await db.select(IMAGE_COLUMNS).from(hotelImages).where(eq(hotelImages.id, imageId));
  return row ?? null;
}

export async function countHotelImages(hotelId: string): Promise<number> {
  const [row] = await db.select({ count: count() }).from(hotelImages).where(eq(hotelImages.hotelId, hotelId));
  return row?.count ?? 0;
}

export async function insertHotelImage(hotelId: string, url: string, isMain: boolean): Promise<HotelImage> {
  const [row] = await db
    .insert(hotelImages)
    .values({
      hotelId,
      url,
      isMain,
      sortOrder: sql`(SELECT COALESCE(MAX(${hotelImages.sortOrder}), -1) + 1 FROM ${hotelImages} WHERE ${hotelImages.hotelId} = ${hotelId})`,
    })
    .returning(IMAGE_COLUMNS);
  if (!row) throw new Error("Failed to insert hotel image");
  return row;
}

export async function deleteHotelImage(imageId: string): Promise<void> {
  await db.delete(hotelImages).where(eq(hotelImages.id, imageId));
}

export async function reorderHotelImages(
  hotelId: string,
  imageIds: string[],
  mainImageId: string,
): Promise<HotelImage[]> {
  await db.transaction(async (tx) => {
    await tx.update(hotelImages).set({ isMain: false }).where(eq(hotelImages.hotelId, hotelId));
    for (const [index, imageId] of imageIds.entries()) {
      await tx
        .update(hotelImages)
        .set({ sortOrder: index, isMain: imageId === mainImageId })
        .where(and(eq(hotelImages.id, imageId), eq(hotelImages.hotelId, hotelId)));
    }
  });
  return listHotelImages(hotelId);
}
