import { db } from "../config/db";
import type { HotelImage } from "../models/hotel.model";

const IMAGE_COLUMNS = `id, hotel_id AS "hotelId", url, is_main AS "isMain", sort_order AS "sortOrder"`;

export async function listHotelImages(hotelId: string): Promise<HotelImage[]> {
  const { rows } = await db.query<HotelImage>(
    `SELECT ${IMAGE_COLUMNS} FROM hotel_images WHERE hotel_id = $1 ORDER BY sort_order`,
    [hotelId],
  );
  return rows;
}

export async function getHotelImageById(imageId: string): Promise<HotelImage | null> {
  const { rows } = await db.query<HotelImage>(`SELECT ${IMAGE_COLUMNS} FROM hotel_images WHERE id = $1`, [imageId]);
  return rows[0] ?? null;
}

export async function countHotelImages(hotelId: string): Promise<number> {
  const { rows } = await db.query<{ count: string }>(`SELECT COUNT(*) AS count FROM hotel_images WHERE hotel_id = $1`, [
    hotelId,
  ]);
  return Number(rows[0]?.count ?? 0);
}

export async function insertHotelImage(hotelId: string, url: string, isMain: boolean): Promise<HotelImage> {
  const { rows } = await db.query<HotelImage>(
    `INSERT INTO hotel_images (hotel_id, url, is_main, sort_order)
     VALUES ($1, $2, $3, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM hotel_images WHERE hotel_id = $1))
     RETURNING ${IMAGE_COLUMNS}`,
    [hotelId, url, isMain],
  );
  const row = rows[0];
  if (!row) throw new Error("Failed to insert hotel image");
  return row;
}

export async function deleteHotelImage(imageId: string): Promise<void> {
  await db.query(`DELETE FROM hotel_images WHERE id = $1`, [imageId]);
}

export async function reorderHotelImages(
  hotelId: string,
  imageIds: string[],
  mainImageId: string,
): Promise<HotelImage[]> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(`UPDATE hotel_images SET is_main = false WHERE hotel_id = $1`, [hotelId]);
    for (let index = 0; index < imageIds.length; index += 1) {
      await client.query(
        `UPDATE hotel_images SET sort_order = $1, is_main = $2 WHERE id = $3 AND hotel_id = $4`,
        [index, imageIds[index] === mainImageId, imageIds[index], hotelId],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  return listHotelImages(hotelId);
}
