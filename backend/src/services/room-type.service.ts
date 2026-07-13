import type { RoomFeature, RoomType, RoomTypeImage } from "../models/room-type.schema";
import {
  getRoomTypeById,
  insertRoomType,
  listRoomTypesByHotel,
  softDeleteRoomType,
  updateRoomType as updateRoomTypeRow,
} from "../queries/room-types.queries";
import { getRoomTypeFeatures, setRoomTypeFeatures } from "../queries/room-type-features.queries";
import {
  countRoomTypeImages,
  deleteRoomTypeImage as deleteRoomTypeImageRow,
  getRoomTypeImageById,
  insertRoomTypeImage,
  listRoomTypeImages,
  reorderRoomTypeImages as reorderRoomTypeImagesRows,
} from "../queries/room-type-images.queries";
import { deleteImageByUrl, uploadImage, type UploadableFile } from "./upload.service";
import type { CreateRoomTypeInput, UpdateRoomTypeInput } from "../types/room-type.schemas";
import { enumerateStayDates, HELD_BOOKING_STATUSES, resolveRoomTypeAvailability } from "./availability.service";
import { findOverlappingBookings, findRateOverridesForRoomTypes } from "../queries/search.queries";
import { listMealPlansForPicker } from "./meal-plan.service";

export interface RoomTypeWithDetails extends RoomType {
  features: RoomFeature[];
  images: RoomTypeImage[];
}

async function attachDetails(roomTypeId: string): Promise<RoomTypeWithDetails> {
  const roomType = await getRoomTypeById(roomTypeId);
  if (!roomType) {
    throw new Error("Room type not found");
  }
  const [features, images] = await Promise.all([getRoomTypeFeatures(roomTypeId), listRoomTypeImages(roomTypeId)]);
  return { ...roomType, features, images };
}

export async function listRoomTypesForHotel(hotelId: string): Promise<RoomTypeWithDetails[]> {
  const roomTypes = await listRoomTypesByHotel(hotelId);
  return Promise.all(roomTypes.map((roomType) => attachDetails(roomType.id)));
}

const DEFAULT_MEAL_PLAN_LABEL = "Room Only";

export interface RoomTypeAvailabilityDetails extends RoomTypeWithDetails {
  mealPlanName: string;
  avgNightlyPrice: number;
  remainingInventory: number;
  isSoldOut: boolean;
}

export interface RoomTypeAvailabilityParams {
  hotelId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  kids: number;
  rooms: number;
}

// Room types that fit but lack inventory are kept (isSoldOut: true) rather than dropped — on a single-hotel page, a room type silently disappearing would read as a bug.
export async function listRoomTypesWithAvailability(
  params: RoomTypeAvailabilityParams,
): Promise<RoomTypeAvailabilityDetails[]> {
  const [roomTypes, mealPlans] = await Promise.all([listRoomTypesForHotel(params.hotelId), listMealPlansForPicker()]);
  const fittingRoomTypes = roomTypes.filter(
    (roomType) => roomType.maxAdults >= params.adults && roomType.maxKids >= params.kids,
  );
  if (fittingRoomTypes.length === 0) return [];

  const mealPlanNameById = new Map(mealPlans.map((mealPlan) => [mealPlan.id, mealPlan.name]));
  const stayDates = enumerateStayDates(params.checkIn, params.checkOut);
  const fittingRoomTypeIds = fittingRoomTypes.map((roomType) => roomType.id);
  const [overrides, overlappingBookings] = await Promise.all([
    findRateOverridesForRoomTypes(fittingRoomTypeIds, stayDates),
    findOverlappingBookings(fittingRoomTypeIds, params.checkIn, params.checkOut, HELD_BOOKING_STATUSES),
  ]);
  const availabilityByRoomType = resolveRoomTypeAvailability(fittingRoomTypes, stayDates, overrides, overlappingBookings);

  return fittingRoomTypes
    .map((roomType) => {
      const availability = availabilityByRoomType.get(roomType.id);
      const remainingInventory = availability?.remainingInventory ?? 0;
      return {
        ...roomType,
        mealPlanName: roomType.mealPlanId ? (mealPlanNameById.get(roomType.mealPlanId) ?? DEFAULT_MEAL_PLAN_LABEL) : DEFAULT_MEAL_PLAN_LABEL,
        avgNightlyPrice: Math.round(availability?.avgNightlyPrice ?? roomType.basePrice),
        remainingInventory,
        isSoldOut: remainingInventory < params.rooms,
      };
    })
    .sort((a, b) => a.basePrice - b.basePrice);
}

export async function getRoomTypeForAdmin(id: string): Promise<RoomTypeWithDetails> {
  return attachDetails(id);
}

export async function createRoomType(hotelId: string, input: CreateRoomTypeInput): Promise<RoomTypeWithDetails> {
  const roomType = await insertRoomType({ ...input, hotelId });
  await setRoomTypeFeatures(roomType.id, input.roomFeatureIds);
  return attachDetails(roomType.id);
}

export async function updateRoomTypeById(id: string, input: UpdateRoomTypeInput): Promise<RoomTypeWithDetails> {
  const existing = await getRoomTypeById(id);
  if (!existing) {
    throw new Error("Room type not found");
  }
  const updated = await updateRoomTypeRow(id, { ...input, hotelId: existing.hotelId });
  if (!updated) {
    throw new Error("Room type not found");
  }
  await setRoomTypeFeatures(id, input.roomFeatureIds);
  return attachDetails(id);
}

export async function deleteRoomTypeById(id: string): Promise<void> {
  const deleted = await softDeleteRoomType(id);
  if (!deleted) {
    throw new Error("Room type not found");
  }
}

export async function addRoomTypeImage(roomTypeId: string, file: UploadableFile): Promise<RoomTypeImage> {
  const roomType = await getRoomTypeById(roomTypeId);
  if (!roomType) {
    throw new Error("Room type not found");
  }
  const url = await uploadImage(file, `room-types/${roomTypeId}`);
  const isFirstImage = (await countRoomTypeImages(roomTypeId)) === 0;
  return insertRoomTypeImage(roomTypeId, url, isFirstImage);
}

export async function reorderRoomTypeImages(
  roomTypeId: string,
  imageIds: string[],
  mainImageId: string,
): Promise<RoomTypeImage[]> {
  return reorderRoomTypeImagesRows(roomTypeId, imageIds, mainImageId);
}

export async function removeRoomTypeImage(roomTypeId: string, imageId: string): Promise<void> {
  const image = await getRoomTypeImageById(imageId);
  if (!image || image.roomTypeId !== roomTypeId) {
    throw new Error("Image not found");
  }
  await deleteRoomTypeImageRow(imageId);
  await deleteImageByUrl(image.url);
}
