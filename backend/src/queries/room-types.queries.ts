import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../config/db";
import { roomTypes } from "../models/room-type.schema";
import type { RoomType, RoomTypeInput } from "../models/room-type.schema";

const ROOM_TYPE_COLUMNS = {
  id: roomTypes.id,
  hotelId: roomTypes.hotelId,
  name: roomTypes.name,
  description: roomTypes.description,
  maxAdults: roomTypes.maxAdults,
  maxKids: roomTypes.maxKids,
  basePrice: roomTypes.basePrice,
  totalInventory: roomTypes.totalInventory,
  freeCancellation: roomTypes.freeCancellation,
  mealPlanId: roomTypes.mealPlanId,
  createdAt: roomTypes.createdAt,
  updatedAt: roomTypes.updatedAt,
  deletedAt: roomTypes.deletedAt,
};

export interface RoomTypeWriteParams {
  hotelId: string;
  name: string;
  description: string;
  maxAdults: number;
  maxKids: number;
  basePrice: number;
  totalInventory: number;
  freeCancellation: boolean | null;
  mealPlanId: string | null;
}

function writeParamsToRow(params: RoomTypeWriteParams): RoomTypeInput {
  return {
    hotelId: params.hotelId,
    name: params.name,
    description: params.description,
    maxAdults: params.maxAdults,
    maxKids: params.maxKids,
    basePrice: params.basePrice,
    totalInventory: params.totalInventory,
    freeCancellation: params.freeCancellation,
    mealPlanId: params.mealPlanId,
  };
}

export async function listRoomTypesByHotel(hotelId: string): Promise<RoomType[]> {
  return db
    .select(ROOM_TYPE_COLUMNS)
    .from(roomTypes)
    .where(and(eq(roomTypes.hotelId, hotelId), isNull(roomTypes.deletedAt)))
    .orderBy(asc(roomTypes.createdAt));
}

export async function getRoomTypeById(id: string): Promise<RoomType | null> {
  const [row] = await db
    .select(ROOM_TYPE_COLUMNS)
    .from(roomTypes)
    .where(and(eq(roomTypes.id, id), isNull(roomTypes.deletedAt)));
  return row ?? null;
}

export async function insertRoomType(params: RoomTypeWriteParams): Promise<RoomType> {
  const [row] = await db.insert(roomTypes).values(writeParamsToRow(params)).returning(ROOM_TYPE_COLUMNS);
  if (!row) throw new Error("Failed to insert room type");
  return row;
}

export async function updateRoomType(id: string, params: RoomTypeWriteParams): Promise<RoomType | null> {
  const [row] = await db
    .update(roomTypes)
    .set({ ...writeParamsToRow(params), updatedAt: sql`now()` })
    .where(and(eq(roomTypes.id, id), isNull(roomTypes.deletedAt)))
    .returning(ROOM_TYPE_COLUMNS);
  return row ?? null;
}

export async function softDeleteRoomType(id: string): Promise<boolean> {
  const result = await db
    .update(roomTypes)
    .set({ deletedAt: sql`now()` })
    .where(and(eq(roomTypes.id, id), isNull(roomTypes.deletedAt)));
  return (result.rowCount ?? 0) > 0;
}
