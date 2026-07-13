import type { Hotel, HotelImage, HotelWithDetails, SimilarHotel } from "../models/hotel.schema";
import {
  findHotelSearchSuggestions,
  findHotelsForCompare,
  findSimilarHotels,
  getHotelAmenities,
  getHotelById,
  insertHotel,
  isSlugTaken,
  listHotels,
  setHotelAmenities,
  softDeleteHotel,
  updateHotel as updateHotelRow,
} from "../queries/hotels.queries";
import type { CompareHotelRow, HotelSearchSuggestion, ListHotelsResult } from "../queries/hotels.queries";
import {
  countHotelImages,
  deleteHotelImage as deleteHotelImageRow,
  getHotelImageById,
  insertHotelImage,
  listHotelImages,
  reorderHotelImages as reorderHotelImagesRows,
} from "../queries/hotel-images.queries";
import { geocodingProvider } from "./geocoding";
import { deleteImageByUrl, uploadImage, type UploadableFile } from "./upload.service";
import { slugify } from "../utils/slugify";
import type { CreateHotelInput, UpdateHotelInput } from "../types/hotel.schemas";

interface AddressFields {
  addressLine1: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
}

function formatAddress(input: AddressFields): string {
  return [input.addressLine1, input.city, input.state, input.postalCode, input.country].filter(Boolean).join(", ");
}

async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let suffix = 1;
  while (await isSlugTaken(candidate, excludeId)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

async function attachDetails(hotelId: string): Promise<HotelWithDetails> {
  const hotel = await getHotelById(hotelId);
  if (!hotel) {
    throw new Error("Hotel not found");
  }
  const [amenities, images] = await Promise.all([getHotelAmenities(hotelId), listHotelImages(hotelId)]);
  return { ...hotel, amenities, images };
}

export async function listHotelsForAdmin(page: number, pageSize: number): Promise<ListHotelsResult> {
  return listHotels({ page, pageSize });
}

export async function getHotelForAdmin(id: string): Promise<HotelWithDetails> {
  return attachDetails(id);
}

export async function getPublishedHotelDetails(id: string): Promise<HotelWithDetails | null> {
  const hotel = await getHotelById(id);
  if (!hotel || hotel.status !== "published") {
    return null;
  }
  const [amenities, images] = await Promise.all([getHotelAmenities(id), listHotelImages(id)]);
  return { ...hotel, amenities, images };
}

export async function getSimilarHotels(hotel: Hotel): Promise<SimilarHotel[]> {
  return findSimilarHotels({
    excludeId: hotel.id,
    city: hotel.city,
    country: hotel.country,
    latitude: hotel.latitude,
    longitude: hotel.longitude,
  });
}

// A hotel missing here (unpublished, deleted, or a bad id) is silently dropped rather than erroring — the compare table just renders one fewer card.
export async function getHotelsForCompare(ids: string[]): Promise<CompareHotelRow[]> {
  const rows = await findHotelsForCompare(ids);
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.map((id) => byId.get(id)).filter((row): row is CompareHotelRow => row !== undefined);
}

export async function searchHotelSuggestions(query: string, excludeIds: string[]): Promise<HotelSearchSuggestion[]> {
  return findHotelSearchSuggestions(query, excludeIds);
}

function hasManualCoordinates(input: { latitude?: number; longitude?: number }): input is {
  latitude: number;
  longitude: number;
} {
  return input.latitude !== undefined && input.longitude !== undefined;
}

export async function createHotel(input: CreateHotelInput): Promise<HotelWithDetails> {
  const slug = await generateUniqueSlug(input.name);
  const { latitude, longitude } = hasManualCoordinates(input)
    ? input
    : await geocodingProvider.geocode(formatAddress(input));

  const hotel = await insertHotel({ ...input, slug, latitude, longitude });
  await setHotelAmenities(hotel.id, input.amenityIds);
  return attachDetails(hotel.id);
}

export async function updateHotelById(id: string, input: UpdateHotelInput): Promise<HotelWithDetails> {
  const existing = await getHotelById(id);
  if (!existing) {
    throw new Error("Hotel not found");
  }

  const addressChanged =
    existing.addressLine1 !== input.addressLine1 ||
    existing.city !== input.city ||
    (existing.state ?? "") !== (input.state ?? "") ||
    existing.country !== input.country ||
    (existing.postalCode ?? "") !== (input.postalCode ?? "");

  const { latitude, longitude } = hasManualCoordinates(input)
    ? input
    : addressChanged
      ? await geocodingProvider.geocode(formatAddress(input))
      : { latitude: existing.latitude, longitude: existing.longitude };

  const slug = existing.name === input.name ? existing.slug : await generateUniqueSlug(input.name, id);

  const updated = await updateHotelRow(id, { ...input, slug, latitude, longitude });
  if (!updated) {
    throw new Error("Hotel not found");
  }
  await setHotelAmenities(id, input.amenityIds);
  return attachDetails(id);
}

export async function deleteHotelById(id: string): Promise<void> {
  const deleted = await softDeleteHotel(id);
  if (!deleted) {
    throw new Error("Hotel not found");
  }
}

export async function addHotelImage(hotelId: string, file: UploadableFile): Promise<HotelImage> {
  const hotel = await getHotelById(hotelId);
  if (!hotel) {
    throw new Error("Hotel not found");
  }
  const url = await uploadImage(file, `hotels/${hotelId}`);
  const isFirstImage = (await countHotelImages(hotelId)) === 0;
  return insertHotelImage(hotelId, url, isFirstImage);
}

export async function reorderHotelImages(
  hotelId: string,
  imageIds: string[],
  mainImageId: string,
): Promise<HotelImage[]> {
  return reorderHotelImagesRows(hotelId, imageIds, mainImageId);
}

export async function removeHotelImage(hotelId: string, imageId: string): Promise<void> {
  const image = await getHotelImageById(imageId);
  if (!image || image.hotelId !== hotelId) {
    throw new Error("Image not found");
  }
  await deleteHotelImageRow(imageId);
  await deleteImageByUrl(image.url);
}
