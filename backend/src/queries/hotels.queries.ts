import { db } from "../config/db";
import type { Amenity, Hotel, HotelInput, HotelListItem } from "../models/hotel.model";

const HOTEL_COLUMNS = `
  id, name, slug, description,
  address_line1 AS "addressLine1", address_line2 AS "addressLine2",
  city, state, country, postal_code AS "postalCode",
  ST_Y(location::geometry) AS latitude, ST_X(location::geometry) AS longitude,
  star_rating AS "starRating",
  to_char(check_in_time, 'HH24:MI') AS "checkInTime", to_char(check_out_time, 'HH24:MI') AS "checkOutTime",
  free_cancellation AS "freeCancellation", cancellation_policy AS "cancellationPolicy",
  status, average_rating AS "averageRating", review_count AS "reviewCount",
  created_at AS "createdAt", updated_at AS "updatedAt"
`;

export interface HotelWriteParams extends Omit<HotelInput, "amenityIds"> {
  slug: string;
  latitude: number;
  longitude: number;
}

function writeParamsToArray(params: HotelWriteParams): unknown[] {
  return [
    params.name,
    params.slug,
    params.description,
    params.addressLine1,
    params.addressLine2 ?? null,
    params.city,
    params.state ?? null,
    params.country,
    params.postalCode ?? null,
    params.longitude,
    params.latitude,
    params.starRating,
    params.checkInTime,
    params.checkOutTime,
    params.freeCancellation,
    params.cancellationPolicy,
    params.status,
  ];
}

export async function insertHotel(params: HotelWriteParams): Promise<Hotel> {
  const { rows } = await db.query<Hotel>(
    `INSERT INTO hotels (
       name, slug, description, address_line1, address_line2, city, state, country, postal_code,
       location, star_rating, check_in_time, check_out_time, free_cancellation, cancellation_policy, status
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9,
       ST_SetSRID(ST_MakePoint($10, $11), 4326)::geography, $12, $13, $14, $15, $16, $17
     )
     RETURNING ${HOTEL_COLUMNS}`,
    writeParamsToArray(params),
  );
  const row = rows[0];
  if (!row) throw new Error("Failed to insert hotel");
  return row;
}

export async function updateHotel(id: string, params: HotelWriteParams): Promise<Hotel | null> {
  const { rows } = await db.query<Hotel>(
    `UPDATE hotels SET
       name = $1, slug = $2, description = $3, address_line1 = $4, address_line2 = $5,
       city = $6, state = $7, country = $8, postal_code = $9,
       location = ST_SetSRID(ST_MakePoint($10, $11), 4326)::geography,
       star_rating = $12, check_in_time = $13, check_out_time = $14,
       free_cancellation = $15, cancellation_policy = $16, status = $17,
       updated_at = now()
     WHERE id = $18 AND deleted_at IS NULL
     RETURNING ${HOTEL_COLUMNS}`,
    [...writeParamsToArray(params), id],
  );
  return rows[0] ?? null;
}

export async function getHotelById(id: string): Promise<Hotel | null> {
  const { rows } = await db.query<Hotel>(`SELECT ${HOTEL_COLUMNS} FROM hotels WHERE id = $1 AND deleted_at IS NULL`, [
    id,
  ]);
  return rows[0] ?? null;
}

export interface ListHotelsParams {
  page: number;
  pageSize: number;
}

export interface ListHotelsResult {
  items: HotelListItem[];
  total: number;
}

export async function listHotels({ page, pageSize }: ListHotelsParams): Promise<ListHotelsResult> {
  const offset = (page - 1) * pageSize;
  const { rows } = await db.query<HotelListItem>(
    `SELECT
       h.id, h.name, h.city, h.country, h.star_rating AS "starRating", h.status,
       h.created_at AS "createdAt",
       (SELECT url FROM hotel_images WHERE hotel_id = h.id AND is_main = true LIMIT 1) AS "mainImageUrl"
     FROM hotels h
     WHERE h.deleted_at IS NULL
     ORDER BY h.created_at DESC
     LIMIT $1 OFFSET $2`,
    [pageSize, offset],
  );
  const { rows: countRows } = await db.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM hotels WHERE deleted_at IS NULL`,
  );
  return { items: rows, total: Number(countRows[0]?.count ?? 0) };
}

export async function softDeleteHotel(id: string): Promise<boolean> {
  const { rowCount } = await db.query(`UPDATE hotels SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`, [
    id,
  ]);
  return (rowCount ?? 0) > 0;
}

export async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const { rows } = await db.query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM hotels WHERE slug = $1 AND ($2::uuid IS NULL OR id != $2)) AS exists`,
    [slug, excludeId ?? null],
  );
  return rows[0]?.exists ?? false;
}

export async function getHotelAmenities(hotelId: string): Promise<Amenity[]> {
  const { rows } = await db.query<Amenity>(
    `SELECT a.id, a.name, a.icon FROM amenities a
     JOIN hotel_amenities ha ON ha.amenity_id = a.id
     WHERE ha.hotel_id = $1
     ORDER BY a.name`,
    [hotelId],
  );
  return rows;
}

export async function setHotelAmenities(hotelId: string, amenityIds: string[]): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM hotel_amenities WHERE hotel_id = $1`, [hotelId]);
    for (const amenityId of amenityIds) {
      await client.query(`INSERT INTO hotel_amenities (hotel_id, amenity_id) VALUES ($1, $2)`, [
        hotelId,
        amenityId,
      ]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
